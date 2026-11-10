-- CARIMBAR MV nuvem 1.0 - backend (aditivo; nao altera nada da 1.1-1.4)
-- Aplicado no projeto Supabase carimbar (ref ybcoiphfbkmnzfppkryq) em duas migracoes:
--   carimbar_mv_nuvem_imagens  e  carimbar_mv_nuvem_varias_imagens (esta substituiu as funcoes da primeira por versoes com ate 4 imagens).
-- Este arquivo e o resultado final das duas.

-- fotos da janela do MV: uma linha por foto, apagadas junto com a extracao (on delete cascade) pela limpeza de 24 h ja existente
create table carimbar.imagens (
  id bigint generated always as identity primary key,
  extracao_id bigint not null references carimbar.mensagens(id) on delete cascade,
  codigo text not null check (codigo ~ '^[A-Za-z0-9_-]{32,128}$'),
  mime text not null check (mime in ('image/jpeg','image/png')),
  dados text not null check (length(dados) <= 900000),   -- base64
  criado_em timestamptz not null default now(),
  ordem int not null default 1
);
create index imagens_extracao_idx on carimbar.imagens (extracao_id);
create unique index imagens_extracao_ordem_idx on carimbar.imagens (extracao_id, ordem);
alter table carimbar.imagens enable row level security;
revoke all on carimbar.imagens from public, anon, authenticated;
create policy "sem acesso direto (somente funcoes)" on carimbar.imagens as restrictive for all to anon, authenticated using (false) with check (false);

-- envio da extracao do MV (JSON + ate 4 fotos em base64). Mesmo codigo secreto de sessao e mesmos limites por hora da 1.x
create or replace function public.carimbar_enviar_mv(p_codigo text, p_conteudo jsonb, p_url text, p_pagina text, p_imagens jsonb)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_id bigint; v_n int; v_ni int; v_q int := 0; v_total bigint := 0; v_i int; v_el jsonb; v_meta jsonb := '[]'::jsonb; v_mime text; v_b64 text;
begin
  if p_codigo is null or p_codigo !~ '^[A-Za-z0-9_-]{32,128}$' then raise exception 'codigo invalido'; end if;
  if p_conteudo is null or jsonb_typeof(p_conteudo) <> 'object' then raise exception 'conteudo invalido'; end if;
  if octet_length(p_conteudo::text) > 100000 then raise exception 'conteudo grande demais'; end if;
  if p_url is not null and length(p_url) > 2000 then raise exception 'url grande demais'; end if;
  if p_pagina is not null and length(p_pagina) > 100 then raise exception 'pagina invalida'; end if;
  if p_imagens is not null and jsonb_typeof(p_imagens) <> 'array' then raise exception 'imagens deve ser uma lista'; end if;
  v_q := coalesce(jsonb_array_length(p_imagens), 0);
  if v_q > 4 then raise exception 'no maximo 4 imagens por extracao'; end if;
  for v_i in 0 .. v_q - 1 loop
    v_el := p_imagens -> v_i;
    v_mime := v_el ->> 'mime'; v_b64 := v_el ->> 'b64';
    if v_mime is null or v_mime not in ('image/jpeg','image/png') then raise exception 'tipo de imagem invalido'; end if;
    if v_b64 is null or length(v_b64) > 900000 then raise exception 'imagem % grande demais (limite ~650 KB cada)', v_i + 1; end if;
    if v_b64 !~ '^[A-Za-z0-9+/]+={0,2}$' then raise exception 'imagem % nao esta em base64', v_i + 1; end if;
    v_total := v_total + length(v_b64);
  end loop;
  if v_total > 2400000 then raise exception 'imagens grandes demais no total'; end if;
  select count(*) into v_n from carimbar.mensagens where codigo = p_codigo and criado_em > now() - interval '1 hour';
  if v_n >= 300 then raise exception 'limite de envios por hora atingido'; end if;
  select count(*) into v_ni from carimbar.imagens where codigo = p_codigo and criado_em > now() - interval '1 hour';
  if v_ni + v_q > 120 then raise exception 'limite de imagens por hora atingido'; end if;
  insert into carimbar.mensagens (codigo, tipo, conteudo, url, pagina)
    values (p_codigo, 'extracao', p_conteudo, p_url, p_pagina) returning id into v_id;
  for v_i in 0 .. v_q - 1 loop
    v_el := p_imagens -> v_i;
    insert into carimbar.imagens (extracao_id, codigo, mime, dados, ordem) values (v_id, p_codigo, v_el ->> 'mime', v_el ->> 'b64', v_i + 1);
    v_meta := v_meta || jsonb_build_array(jsonb_build_object('n', v_i + 1, 'mime', v_el ->> 'mime', 'bytesAprox', length(v_el ->> 'b64') * 3 / 4));
  end loop;
  if v_q > 0 then
    update carimbar.mensagens set conteudo = conteudo || jsonb_build_object('numImagens', v_q, 'imagens', v_meta,
      'baixarImagem', 'POST /rest/v1/rpc/carimbar_imagem  corpo {"p_codigo":"<codigo da sessao>","p_extracao_id":' || v_id || ',"p_n":1..' || v_q || '}  retorna {mime, base64}')
      where id = v_id;
  end if;
  return v_id;
end $$;

-- baixa a foto n (1..4) de uma extracao; so com o codigo secreto da sessao; some em 24 h
create or replace function public.carimbar_imagem(p_codigo text, p_extracao_id bigint, p_n int default 1)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare r record;
begin
  if p_codigo is null or p_codigo !~ '^[A-Za-z0-9_-]{32,128}$' then raise exception 'codigo invalido'; end if;
  select i.mime, i.dados, i.criado_em, i.ordem into r from carimbar.imagens i
    where i.extracao_id = p_extracao_id and i.codigo = p_codigo and i.ordem = coalesce(p_n, 1) and i.criado_em > now() - interval '24 hours';
  if not found then return null; end if;
  return jsonb_build_object('n', r.ordem, 'mime', r.mime, 'base64', r.dados, 'criado_em', r.criado_em);
end $$;

-- responde a UMA extracao especifica (a IA usa esta funcao para o MV): grava "extracao":<id> no JSON; o CARIMBAR MV so aceita esse id
create or replace function carimbar.responder_mv(p_extracao_id bigint, p_conteudo jsonb)
returns table (id bigint, codigo text, extracao bigint)
language plpgsql set search_path = '' as $$
declare v_codigo text; v_id bigint;
begin
  if p_conteudo is null or jsonb_typeof(p_conteudo) <> 'object' then raise exception 'o carimbo deve ser um objeto JSON'; end if;
  select m.codigo into v_codigo from carimbar.mensagens m
    where m.id = p_extracao_id and m.tipo = 'extracao' and m.criado_em > now() - interval '24 hours';
  if v_codigo is null then raise exception 'extracao % nao encontrada (ou com mais de 24 h)', p_extracao_id; end if;
  insert into carimbar.mensagens (codigo, tipo, conteudo)
    values (v_codigo, 'carimbo', p_conteudo || jsonb_build_object('extracao', p_extracao_id)) returning mensagens.id into v_id;
  return query select v_id, v_codigo, p_extracao_id;
end $$;

revoke all on function public.carimbar_enviar_mv(text, jsonb, text, text, jsonb) from public, authenticated;
revoke all on function public.carimbar_imagem(text, bigint, int) from public, authenticated;
revoke all on function carimbar.responder_mv(bigint, jsonb) from public, anon, authenticated;
grant execute on function public.carimbar_enviar_mv(text, jsonb, text, text, jsonb) to anon;
grant execute on function public.carimbar_imagem(text, bigint, int) to anon;
