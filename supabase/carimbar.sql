-- CARIMBAR Grok 1.1 - backend Supabase (projeto carimbar, sa-east-1)
-- Gerado a partir das migracoes aplicadas.

-- migracao 20261109105238 carimbar_1_1_mensagens
create extension if not exists pg_cron;

create schema if not exists carimbar;
revoke all on schema carimbar from public, anon, authenticated;

create table carimbar.mensagens (
  id bigint generated always as identity primary key,
  codigo text not null check (codigo ~ '^[A-Za-z0-9_-]{32,128}$'),
  tipo text not null check (tipo in ('extracao','carimbo')),
  conteudo jsonb not null,
  url text,
  pagina text,
  criado_em timestamptz not null default now()
);
create index mensagens_codigo_id_idx on carimbar.mensagens (codigo, id);
create index mensagens_criado_em_idx on carimbar.mensagens (criado_em);
alter table carimbar.mensagens enable row level security;
revoke all on carimbar.mensagens from public, anon, authenticated;

-- topico do Realtime derivado do codigo secreto (sha256), so quem tem o codigo sabe o topico
create or replace function carimbar.topico(p_codigo text) returns text
language sql immutable set search_path = '' as $$
  select 'carimbar-' || encode(extensions.digest(p_codigo, 'sha256'), 'hex')
$$;

-- ao gravar um carimbo, avisa a janela-ponte na hora (so o id; o conteudo e buscado pela funcao com o codigo)
create or replace function carimbar.avisar_carimbo() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.tipo = 'carimbo' then
    perform realtime.send(jsonb_build_object('id', new.id), 'carimbo', carimbar.topico(new.codigo), false);
  end if;
  return new;
end $$;
create trigger mensagens_avisar after insert on carimbar.mensagens
  for each row execute function carimbar.avisar_carimbo();

-- ===== funcoes publicas (unico acesso do navegador) =====
create or replace function public.carimbar_enviar(p_codigo text, p_conteudo jsonb, p_url text default null, p_pagina text default null)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_id bigint; v_n int;
begin
  if p_codigo is null or p_codigo !~ '^[A-Za-z0-9_-]{32,128}$' then raise exception 'codigo invalido'; end if;
  if p_conteudo is null or jsonb_typeof(p_conteudo) <> 'object' then raise exception 'conteudo invalido'; end if;
  if octet_length(p_conteudo::text) > 300000 then raise exception 'conteudo grande demais'; end if;
  if p_url is not null and length(p_url) > 2000 then raise exception 'url grande demais'; end if;
  if p_pagina is not null and length(p_pagina) > 100 then raise exception 'pagina invalida'; end if;
  select count(*) into v_n from carimbar.mensagens where codigo = p_codigo and criado_em > now() - interval '1 hour';
  if v_n >= 300 then raise exception 'limite de envios por hora atingido'; end if;
  insert into carimbar.mensagens (codigo, tipo, conteudo, url, pagina)
    values (p_codigo, 'extracao', p_conteudo, p_url, p_pagina) returning id into v_id;
  return v_id;
end $$;

create or replace function public.carimbar_buscar(p_codigo text, p_desde_id bigint default 0)
returns table (id bigint, conteudo jsonb, criado_em timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if p_codigo is null or p_codigo !~ '^[A-Za-z0-9_-]{32,128}$' then raise exception 'codigo invalido'; end if;
  return query select m.id, m.conteudo, m.criado_em from carimbar.mensagens m
    where m.codigo = p_codigo and m.tipo = 'carimbo' and m.id > coalesce(p_desde_id, 0)
      and m.criado_em > now() - interval '24 hours'
    order by m.id limit 20;
end $$;

revoke all on function public.carimbar_enviar(text, jsonb, text, text) from public, authenticated;
revoke all on function public.carimbar_buscar(text, bigint) from public, authenticated;
grant execute on function public.carimbar_enviar(text, jsonb, text, text) to anon;
grant execute on function public.carimbar_buscar(text, bigint) to anon;

-- ===== funcoes da IA (somente postgres/servico; schema nao exposto na API) =====
create or replace function carimbar.sessoes()
returns table (codigo text, ultima_extracao timestamptz, extracoes bigint, carimbos bigint, ultima_pagina text, ultima_url text)
language sql stable set search_path = '' as $$
  select m.codigo,
         max(m.criado_em) filter (where m.tipo = 'extracao'),
         count(*) filter (where m.tipo = 'extracao'),
         count(*) filter (where m.tipo = 'carimbo'),
         (array_agg(m.pagina order by m.id desc) filter (where m.tipo = 'extracao'))[1],
         (array_agg(m.url order by m.id desc) filter (where m.tipo = 'extracao'))[1]
  from carimbar.mensagens m
  where m.criado_em > now() - interval '24 hours'
  group by m.codigo
  having count(*) filter (where m.tipo = 'extracao') > 0
  order by 2 desc nulls last
$$;

create or replace function carimbar.ultima_extracao(p_codigo text default null)
returns table (id bigint, codigo text, url text, pagina text, conteudo jsonb, criado_em timestamptz)
language sql stable set search_path = '' as $$
  select m.id, m.codigo, m.url, m.pagina, m.conteudo, m.criado_em
  from carimbar.mensagens m
  where m.tipo = 'extracao' and m.criado_em > now() - interval '24 hours'
    and (p_codigo is null or m.codigo = p_codigo)
  order by m.id desc limit 1
$$;

-- envia o JSON para a sessao indicada; sem codigo, para a sessao da extracao mais recente
create or replace function carimbar.responder(p_conteudo jsonb, p_codigo text default null)
returns table (id bigint, codigo text)
language plpgsql set search_path = '' as $$
declare v_codigo text := p_codigo; v_id bigint;
begin
  if p_conteudo is null or jsonb_typeof(p_conteudo) <> 'object' then raise exception 'o carimbo deve ser um objeto JSON'; end if;
  if v_codigo is null then
    select m.codigo into v_codigo from carimbar.mensagens m
      where m.tipo = 'extracao' and m.criado_em > now() - interval '24 hours' order by m.id desc limit 1;
    if v_codigo is null then raise exception 'nenhuma sessao ativa (nenhuma extracao nas ultimas 24 h)'; end if;
  end if;
  insert into carimbar.mensagens (codigo, tipo, conteudo) values (v_codigo, 'carimbo', p_conteudo) returning mensagens.id into v_id;
  return query select v_id, v_codigo;
end $$;

revoke all on function carimbar.sessoes() from public, anon, authenticated;
revoke all on function carimbar.ultima_extracao(text) from public, anon, authenticated;
revoke all on function carimbar.responder(jsonb, text) from public, anon, authenticated;
revoke all on function carimbar.topico(text) from public, anon, authenticated;
revoke all on function carimbar.avisar_carimbo() from public, anon, authenticated;

-- ===== limpeza automatica: apaga tudo com mais de 24 h, de hora em hora =====
select cron.schedule('carimbar-limpeza-24h', '7 * * * *', $$delete from carimbar.mensagens where criado_em < now() - interval '24 hours'$$);

-- migracao 20261109105251 carimbar_politica_sem_acesso_direto
create policy "sem acesso direto (somente funcoes)" on carimbar.mensagens as restrictive for all to anon, authenticated using (false) with check (false);

