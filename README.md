# CARIMBAR Grok 1.2 (com nuvem e envio pelo celular)

Favorito (bookmarklet) que **preenche formulários de qualquer sistema web** e **extrai o conteúdo de qualquer página**. Com a nuvem, a página se preenche sozinha de dois jeitos. Pelo robô: o botão **ENVIAR P/ IA** manda os campos para a IA, que responde direto. Pelo chat comum do Grok: o JSON é enviado pelo celular pareado (novo na 1.2).

- Página de instalação: https://drthaleschateaubriand.github.io/carimbo/
- Enviar do celular (chat do Grok): https://drthaleschateaubriand.github.io/carimbo/enviar.html
- Versões anteriores: [Grok 1.1](https://drthaleschateaubriand.github.io/carimbo/versoes/1.1/) (nuvem, sem celular) e [Grok 1.0](https://drthaleschateaubriand.github.io/carimbo/versoes/1.0/) (sem nuvem)

## Novo na 1.2: usar com o chat comum do Grok

O chat do Grok (grok.com ou app) não acessa a nuvem. Por isso o JSON passa pelo celular:

1. A janela-ponte mostra um QR de pareamento. O celular lê o QR e abre `enviar.html`, que guarda o código da sessão e o apaga da barra de endereço na hora.
2. Você conta o caso ao Grok, ele organiza, você dá OK e ele devolve só o JSON.
3. No celular, em `enviar.html`, você toca **Colar** (ou toca no link `enviar.html#j=…`, se o Grok gerar), confere a prévia por tela e toca **ENVIAR PARA O CARIMBAR**.
4. A página no computador se preenche sozinha pelo mesmo caminho da 1.1 (tempo real, com consulta a cada 3 s de reserva).

Instruções para colar no Grok: [GROK-INSTRUCOES.md](GROK-INSTRUCOES.md).

## Como funciona a nuvem

```
[Página do sistema + favorito CARIMBAR]
      │ postMessage (origem conferida nos dois sentidos)
      ▼
[Janela-ponte ponte.html, no GitHub Pages]
      │ funções seguras (RPC) + Realtime
      ▼
[Supabase, São Paulo]  ◄── IA grava o JSON (SQL)
```

1. **ENVIAR P/ IA** monta um resumo compacto da página (nome, rótulo, tipo, valor atual e opções de cada campo; editores de texto; chaves do CARIMBAR para o tipo detectado). Isso dá de 0,5 a 3 KB, contra cerca de 500 KB do HTML. Não envia HTML nem valores de campos de senha.
2. O favorito abre a janela-ponte e passa o resumo por `postMessage`. O favorito não acessa a rede e não carrega nada de fora.
3. A ponte gera e guarda um código secreto de sessão (32 bytes aleatórios) e grava o resumo no Supabase pela função `carimbar_enviar`.
4. A IA lê o resumo e grava o JSON de resposta. O banco avisa a ponte na hora (Realtime Broadcast num tópico derivado do código) e a ponte também consulta a cada 3 s como reserva.
5. A ponte entrega o JSON ao favorito, que salva em `carimbarJSON` e roda o mesmo CARIMBAR de sempre. A barra mostra o que foi preenchido.

## Segurança

- No navegador só existe a chave pública (publishable). A tabela fica num schema que não é exposto na API e tem RLS sem acesso direto.
- O navegador só consegue chamar quatro funções. A 1.2 acrescentou `carimbar_registrar(codigo)`, que a ponte usa para registrar ou renovar a sessão, e `carimbar_responder_app(codigo, conteudo)`, que o celular usa para gravar um "carimbo". Esta só aceita sessão existente (registrada nos últimos 30 dias ou com envio nas últimas 24 h), objeto JSON de até 50 KB e até 60 envios por hora. As duas da 1.1 são `carimbar_enviar(codigo, conteudo, url, pagina)`, que grava somente "extracao" (até 300 KB e 300 envios por hora por sessão), e `carimbar_buscar(codigo, desde_id)`, que lê somente os "carimbo" da sua sessão. As duas exigem o código secreto.
- As funções da IA (`carimbar.responder`, `carimbar.ultima_extracao`, `carimbar.sessoes`) só podem ser chamadas pelo dono do banco, nunca pela chave pública.
- Tudo é apagado automaticamente após 24 horas (pg_cron, de hora em hora).
- A ponte só aceita mensagens da janela que a abriu e só responde para a origem dela. O favorito só aceita mensagens da ponte que ele mesmo abriu, vindas da origem do GitHub Pages.

## Para a IA

Veja [IA-COMO-RESPONDER.md](IA-COMO-RESPONDER.md).

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `carimbar-grok-1.2.js` | Código-fonte da 1.2 (preenchimento idêntico ao da 1.1, só muda o rótulo) |
| `carimbar-grok-1.2.min.js`, `carimbar-grok-1.2-favorito.txt` | Minificado e favorito pronto (`javascript:...`) |
| `index.html`, `carimbar-grok-1.2-instalar.html` | Página de instalação da 1.2 |
| `carimbar-grok-1.1*`, `build-grok-1.1.cjs` | Arquivos da 1.1 |
| `ponte.html`, `ponte.js`, `vendor/supabase-js-2.119.0.js`, `vendor/qrcode-generator-1.4.4.js` | Janela-ponte com pareamento por QR (bibliotecas fixadas e servidas pelo próprio site) |
| `enviar.html`, `enviar.js`, `enviar-parse.js` | Página do celular: pareamento, colar/link, prévia e envio |
| `GROK-INSTRUCOES.md`, `grok-instrucoes.txt` | Como usar com o chat do Grok e o texto das instruções |
| `unit-tests-enviar.cjs` | Testes da página do celular |
| `supabase/carimbar.sql` | Tabela, funções, aviso em tempo real e limpeza de 24 h |
| `build-grok-1.2.cjs` | Gera min, favorito e páginas da 1.2 (`node build-grok-1.2.cjs`) |
| `unit-tests-comparativo.cjs`, `unit-tests-grok-v2.cjs`, `unit-tests-grok-1.1.cjs` | Testes em jsdom |
| `versoes/1.0/`, `versoes/1.1/` | Versões congeladas (páginas de instalação funcionando) |
| `carimbar-grok.js`, `carimbar-grok.min.js`, `carimbar-grok-favorito.txt`, `carimbar-grok-instalar.html`, `build-grok.cjs` | Arquivos da 1.0 mantidos na raiz |

## Testes (09/11/2026)

- **jsdom (1.2):**
  - Favorito: 75/75 no roteiro comparativo, 30/30 no roteiro v2 e 24/24 nos testes da nuvem. O minificado tem o mesmo resultado.
  - Página do celular: 23/23. Cobre bloco ``` com texto em volta, JSON no meio de texto, #j= base64url, #t=, entradas inválidas, chaves desconhecidas, aspas tipográficas, pareamento removendo o código da URL, envio, erro, Colar, desparear e link aberto com a página já aberta.
- **Ponta a ponta em Chromium real (1.2)**, com um contexto "hospital" (página de teste com o favorito e a ponte) e um contexto "celular" emulado (iPhone 13):
  - O celular pareou pelo QR (QR decodificado igual ao link, código removido da URL).
  - Colou a resposta do Grok com texto em volta e enviou. A página preencheu 16 campos do cadastro em cerca de 1 s (3,8 s com as listas).
  - O link #j= preencheu a antropometria (26 campos) em 0,7 s.
  - Só com a consulta de reserva (Realtime bloqueado), a evolução preencheu em 2,6 s.
- **Segurança da 1.2 com a chave pública:**
  - Código desconhecido é recusado e código inválido também.
  - Lista e conteúdo acima de 50 KB são recusados.
  - O limite de 60 envios por hora barra o 61º.
  - Não há acesso direto às tabelas.

```
CARIMBAR_FILE=carimbar-grok-1.2.js node unit-tests-grok-1.1.cjs
node unit-tests-enviar.cjs
```

## Observações

- Deixe a janela-ponte aberta. Se o navegador bloquear a janela, permita pop-ups para o site do sistema.
- Confira sempre os campos antes de salvar no sistema.
- Fase de teste: não distribua sem revisão.
