# Como a IA atende o CARIMBAR MV nuvem (extrações do SoulMV com fotos)

Projeto Supabase `carimbar` (ref `ybcoiphfbkmnzfppkryq`). Mesmo caminho do CARIMBAR 1.3/1.4 (`ultima_extracao` para ler, uma função para responder). A 1.3/1.4 e o jeito antigo de responder continuam como estavam. Dados de teste sempre fictícios.

## 1. Reconhecer uma extração do MV

```sql
select id, codigo, url, pagina, conteudo, criado_em from carimbar.ultima_extracao();
```

É do MV quando `conteudo->>'origem' = 'carimbar-mv'` (e `pagina` começa com `carimbar-mv:`). Campos úteis de `conteudo`:

- `tela` (evolucao, prescricao, exames, admissao, alta, antropometria), `titulo` (título da janela), `enviadoEm` (UTC);
- `chavesCarimbar.<tela>`: as chaves que o CARIMBAR MV cola, **na ordem do Tab**; `ordemTab` mostra também os campos pulados;
- `telaExemplo: true` = a ordem do Tab dessa tela ainda não foi conferida no hospital (avise o médico);
- `numImagens` (1 a 4) e `imagens` (n, mime, bytesAprox);
- `pacienteNaTela` vem sempre `null`: a tela do MV não é legível. O paciente tem de ser lido do cabeçalho nas fotos e confirmado com o médico.

Para escolher outra sessão: `carimbar.ultima_extracao('<codigo>')`. O `id` da extração é o número que o médico vê na janela do programa.

## 2. Baixar e ver as fotos

As fotos ficam na nuvem (tabela privada, apagada com a extração em 24 h). Baixe pela função pública `carimbar_imagem`, com o `codigo` da extração (é o segredo da sessão). Pela caixa (box), com `curl`:

```bash
COD='<codigo da extração>'; ID=<id da extração>; N=<numImagens>
for n in $(seq 1 $N); do
  curl -s -X POST "https://ybcoiphfbkmnzfppkryq.supabase.co/rest/v1/rpc/carimbar_imagem" \
    -H "apikey: sb_publishable_FMNJjtCEZ_HYVliMWgnfgA_PEBAzeGM" -H "Content-Type: application/json" \
    -d "{\"p_codigo\":\"$COD\",\"p_extracao_id\":$ID,\"p_n\":$n}" | jq -r .base64 | base64 -d > /tmp/mv_${ID}_$n.jpg
done
```

Depois **abra cada arquivo com a ferramenta de leitura de imagem** (Read) para ver a foto. A resposta de `carimbar_imagem` é `{n, mime, base64, criado_em}` (ou `null` se não existe ou passou de 24 h). Não use `execute_sql` para trazer o base64 para o chat (é enorme). As fotos seguem a ordem em que o médico rolou a tela (foto 1 = topo). Apague os arquivos de /tmp quando terminar e **não salve fotos no Drive, no repositório nem na memória**: têm dados de paciente.

## 3. Responder (sempre amarrado ao número da extração)

```sql
select * from carimbar.responder_mv(<id da extração>, $j${"paciente":"Nome como o médico ditou","prontuario":"123","evolucao":"texto\ncom linhas"}$j$::jsonb);
```

`responder_mv` descobre a sessão pelo `id` e grava o número em `"extracao"` dentro do JSON. **O CARIMBAR MV só aceita resposta com esse número e ignora as outras.** Por isso, para o MV, **não use `carimbar.responder(...)` sem número** (a resposta seria ignorada). A 1.3/1.4 continua usando `carimbar.responder` como sempre.

Regras do JSON:
- JSON plano. Sempre `"paciente"` (nome como o médico ditou, conferido com o cabeçalho que aparece na foto) e `"prontuario"` quando houver. **Sem paciente, o CARIMBAR MV desliga os botões de colar.**
- As demais chaves são **as de `chavesCarimbar.<tela>`**, as mesmas da 1.3/1.4 (`evolucao`, `prescricao`, `exames`, `data`, `altura`, `peso`, `cCintura`...). Chave que o médico não ditou: **omita** (não invente; o programa só dá o Tab). Texto livre com `\n` entre as linhas; datas em `DD/MM/AAAA`.
- O programa só cola texto. Caixas de marcar e listas não são preenchidas.
- Um paciente por resposta, uma extração por vez. Para outro paciente, o médico faz uma nova extração.
- Se o nome ditado for diferente do nome na foto, **não responda**: pergunte ao médico.
- Se `telaExemplo` for `true`, avise: "a ordem do Tab dessa tela ainda não foi conferida no hospital; confira cada campo depois de colar".

A extração e a resposta expiram sozinhas em 24 h (junto com as fotos).

## 4. O que a skill `carimbar-nuvem` deve dizer (texto sugerido)

> **Extrações do MV (origem `carimbar-mv`).** Quando `ultima_extracao()` trouxer `conteudo->>'origem' = 'carimbar-mv'`, a extração é do SoulMV (Flash) e não tem campos lidos, só **fotos** da janela. 1) Anote `id`, `codigo`, `tela`, `chavesCarimbar.<tela>`, `numImagens` e `telaExemplo`. 2) Baixe cada foto n=1..numImagens com `POST https://ybcoiphfbkmnzfppkryq.supabase.co/rest/v1/rpc/carimbar_imagem` (header `apikey` = a chave pública do CARIMBAR, corpo `{"p_codigo":codigo,"p_extracao_id":id,"p_n":n}`), com `jq -r .base64 | base64 -d > /tmp/mv_<id>_<n>.jpg`, e **veja cada JPG com Read**. Nunca traga o base64 pelo `execute_sql`. Apague os arquivos depois e não os salve em lugar nenhum. 3) Confira o paciente da foto (cabeçalho) com o que o médico ditou; se divergir, pergunte. 4) Responda **só** com `select * from carimbar.responder_mv(<id>, $j${...}$j$::jsonb);` com `paciente`, `prontuario` e as chaves de `chavesCarimbar.<tela>` que o médico ditou (omita as outras, texto livre com `\n`, datas DD/MM/AAAA). Nunca use `carimbar.responder` para o MV: sem o número da extração o CARIMBAR MV ignora a resposta. 5) Se `telaExemplo` for true, avise que a ordem do Tab não foi conferida no hospital. 6) A extração e as fotos duram 24 h; uma extração por paciente/tela.
