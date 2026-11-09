# CARIMBAR Grok 1.1 (com nuvem)

Favorito (bookmarklet) que **preenche formulários de qualquer sistema web** e **extrai o conteúdo de qualquer página**. Novo na 1.1: o botão **ENVIAR P/ IA** manda um resumo dos campos da página para a IA; você diz no chat o que preencher e a página se preenche sozinha.

- Página de instalação: https://drthaleschateaubriand.github.io/carimbo/
- Versão anterior, sem nuvem (Grok 1.0): https://drthaleschateaubriand.github.io/carimbo/versoes/1.0/

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
- O navegador só consegue chamar duas funções: `carimbar_enviar(codigo, conteudo, url, pagina)`, que grava somente "extracao" (até 300 KB e 300 envios por hora por sessão), e `carimbar_buscar(codigo, desde_id)`, que lê somente os "carimbo" da sua sessão. As duas exigem o código secreto.
- As funções da IA (`carimbar.responder`, `carimbar.ultima_extracao`, `carimbar.sessoes`) só podem ser chamadas pelo dono do banco, nunca pela chave pública.
- Tudo é apagado automaticamente após 24 horas (pg_cron, de hora em hora).
- A ponte só aceita mensagens da janela que a abriu e só responde para a origem dela. O favorito só aceita mensagens da ponte que ele mesmo abriu, vindas da origem do GitHub Pages.

## Para a IA

Veja [IA-COMO-RESPONDER.md](IA-COMO-RESPONDER.md).

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `carimbar-grok-1.1.js` | Código-fonte da 1.1 |
| `carimbar-grok-1.1.min.js`, `carimbar-grok-1.1-favorito.txt` | Minificado e favorito pronto (`javascript:...`) |
| `index.html`, `carimbar-grok-1.1-instalar.html` | Página de instalação da 1.1 |
| `ponte.html`, `ponte.js`, `vendor/supabase-js-2.119.0.js` | Janela-ponte (supabase-js fixado e servido pelo próprio site) |
| `supabase/carimbar.sql` | Tabela, funções, aviso em tempo real e limpeza de 24 h |
| `build-grok-1.1.cjs` | Gera min, favorito e páginas da 1.1 (`node build-grok-1.1.cjs`) |
| `unit-tests-comparativo.cjs`, `unit-tests-grok-v2.cjs`, `unit-tests-grok-1.1.cjs` | Testes em jsdom |
| `versoes/1.0/` | Grok 1.0 congelada (página de instalação funcionando) |
| `carimbar-grok.js`, `carimbar-grok.min.js`, `carimbar-grok-favorito.txt`, `carimbar-grok-instalar.html`, `build-grok.cjs` | Arquivos da 1.0 mantidos na raiz |

## Testes (09/11/2026)

- **jsdom:** 1.1 com 75/75 no roteiro comparativo, 30/30 no roteiro v2 e 24/24 nos testes novos da nuvem (resumo da página, aperto de mão, origem e janela conferidas, fila, pop-up bloqueado). O minificado tem o mesmo resultado.
- **Ponta a ponta em Chromium real** com páginas de teste locais montadas a partir das telas capturadas (cadastro, antropometria e evolução) e paciente fictícia. A IA gravou o JSON pelo SQL e a página se preencheu sozinha pela ponte publicada, em tempo real e também só com a consulta de reserva (Realtime bloqueado).
- **Segurança testada com a chave pública:** sem acesso direto à tabela, sem acesso às funções da IA, sem leitura de outra sessão sem o código, e com rejeição de código inválido e de conteúdo grande demais.

```
CARIMBAR_FILE=carimbar-grok-1.1.js node unit-tests-grok-1.1.cjs
```

## Observações

- Deixe a janela-ponte aberta. Se o navegador bloquear a janela, permita pop-ups para o site do sistema.
- Confira sempre os campos antes de salvar no sistema.
- Fase de teste: não distribua sem revisão.
