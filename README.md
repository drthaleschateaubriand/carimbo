# CARIMBAR Grok 1.4 (lê telas em quadros, como o MV PEP)

Favorito (bookmarklet) que **preenche formulários de qualquer sistema web** e **extrai o conteúdo de qualquer página**. Com a nuvem, a página se preenche sozinha de dois jeitos. Pelo robô: o botão **ENVIAR P/ IA** manda os campos para a IA, que responde direto. Pelo chat comum do Grok: o JSON é enviado pelo celular pareado (1.2). Na 1.3 o CARIMBAR passou a só preencher se o JSON for do paciente que está na tela. Na 1.4 ele lê e preenche telas montadas em quadros (iframes/frames), como o MV PEP, e preenche formulários de qualquer sistema pelo nome ou rótulo do campo.

- Página de instalação: https://drthaleschateaubriand.github.io/carimbo/
- Enviar do celular (chat do Grok): https://drthaleschateaubriand.github.io/carimbo/enviar.html
- Versões anteriores: [Grok 1.3](https://drthaleschateaubriand.github.io/carimbo/versoes/1.3/) (sem leitura de quadros), [Grok 1.2](https://drthaleschateaubriand.github.io/carimbo/versoes/1.2/) (sem conferência do paciente), [Grok 1.1](https://drthaleschateaubriand.github.io/carimbo/versoes/1.1/) (nuvem, sem celular) e [Grok 1.0](https://drthaleschateaubriand.github.io/carimbo/versoes/1.0/) (sem nuvem)

## Programas para o computador (Windows e Mac)

Além do favorito do navegador, há o programa do computador (fotos da janela da frente + nuvem + colagem campo a campo), na versão 1.0:

- [CARIMBAR para Windows](https://drthaleschateaubriand.github.io/carimbo/downloads/CARIMBAR-para-Windows-1.0.zip) (AutoHotkey v2)
- [CARIMBAR para Mac, Apple Silicon](https://drthaleschateaubriand.github.io/carimbo/downloads/CARIMBAR-para-Mac-1.0.0-arm64.zip)
- [CARIMBAR para Mac, Intel](https://drthaleschateaubriand.github.io/carimbo/downloads/CARIMBAR-para-Mac-1.0.0-x64.zip)

Código e instruções do Mac: [carimbar-mac/LEIAME.md](carimbar-mac/LEIAME.md). Código do Windows: [carimbar-mv/](carimbar-mv/).

## Novo na 1.4: quadros (MV PEP), modo genérico e navegador do SoulMV

- **Quadros:** procura campos, editores e o paciente em todos os `iframe`/`frame` da mesma origem, inclusive `frameset`, quadros aninhados e shadow DOM aberto. Quadros de outro site não podem ser lidos pelo navegador: a barra mostra "Quadros lidos: N | de outro site, ignorados: M".
- **Modo genérico:** em telas sem tipo conhecido, a chave do JSON é comparada com `name`, `id`, `aria-label`, `placeholder` e rótulo do campo. Também aceita `{"campos": {"PA": "120x80"}}`. `evolucao`/`texto` vai para a caixa de texto clicada por último ou para a única da tela.
- **Eventos:** focus, keydown, input, keyup, change, blur e focusout, com a janela do próprio quadro (ExtJS, GWT, Angular).
- **Editores:** `contenteditable`, editor em iframe (`designMode`), CKEditor 4 e TinyMCE, além do CKEditor 5.
- **Destaque:** contorno verde nos campos preenchidos; **AVANCADO > CAMPOS** mostra em azul o que o CARIMBAR enxerga, quadro por quadro.
- **SoulMV:** a página de instalação ganhou a aba "SoulMV / navegador do MV" (copiar o código para um favorito ou para a barra de endereço, abrir o MV no Chrome/Edge, ou copiar e colar cada texto pela `enviar.html`, que agora tem botão **Copiar** em cada texto).
- Detalhes: [carimbar-grok-mudancas.md](carimbar-grok-mudancas.md).

## Novo na 1.3: conferência do paciente

O JSON leva `"paciente"` (o nome como foi ditado) e, se ditado, `"prontuario"`.

- **Quem está na tela:** o favorito procura o nome no cabeçalho ou cartão do paciente (`patient-name` e parecidos), na janela aberta ("Paciente: …"), no campo nome preenchido, em rótulos "Paciente"/"Nome" e no título da página, e o número do prontuário. A barra mostra **Paciente na tela: …**. Se duas fontes fortes discordarem (por exemplo, cabeçalho de um paciente e janela de outro), conta como não identificado.
- **Conferência:** sem diferença de maiúsculas e acentos; todas as palavras ditadas precisam estar no nome da tela ("José" confere com "José Carlos Silva"; "de", "da", "dos" etc. são ignorados). Com vários JSONs que conferem, vale o mais específico; com prontuário dos dois lados, ele precisa bater.
- **Outro paciente:** "Este JSON é do paciente X, mas a tela aberta é de Y. Nada foi preenchido." Pela nuvem, o JSON fica na fila e o resumo anterior continua visível.
- **Paciente não identificado:** "Não consegui identificar o paciente nesta tela", com **Preencher mesmo assim** e **Cancelar**.
- **Cadastro novo** (campo nome vazio): sem conferência; `paciente` vira o nome.
- **JSON sem `paciente`:** preenche como na 1.2, com o aviso "JSON sem paciente: sem checagem".
- **Fila de pacientes** (`sessionStorage` da aba, chave `carimbarFila`): cada JSON com paciente entra na fila (reenvio do mesmo paciente substitui). A barra mostra "Fila: José, Maria" e **limpar fila**. Cada tela, ao clicar CARIMBAR ou ao receber pela nuvem, usa o JSON do seu paciente.
- **`enviar.html`:** aceita vários blocos JSON numa colagem, mostra a prévia por paciente e envia todos, um por vez. Com mais de um JSON, todos precisam de `paciente`.
- **EXTRAIR:** o HTML copiado agora traz o que foi digitado (valor dos campos, texto das caixas, opção escolhida, caixas marcadas). Campos de senha ficam de fora.
- **ENVIAR P/ IA:** o resumo enviado inclui `pacienteNaTela`.

## Usar com o chat comum do Grok (desde a 1.2)

O chat do Grok (grok.com ou app) não acessa a nuvem. Por isso o JSON passa pelo celular:

1. A janela-ponte mostra um QR de pareamento. O celular lê o QR e abre `enviar.html`, que guarda o código da sessão e o apaga da barra de endereço na hora.
2. Você conta o caso ao Grok (com o nome do paciente), ele organiza, você dá OK e ele devolve um bloco JSON por paciente.
3. No celular, em `enviar.html`, você toca **Colar** (ou toca no link `enviar.html#j=…`, se o Grok gerar), confere a prévia por paciente e tela e toca **ENVIAR PARA O CARIMBAR**.
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
| `carimbar-grok-1.4.js` | Código-fonte da 1.4 (quadros, modo genérico, destaque, CAMPOS) |
| `carimbar-grok-1.4.min.js`, `carimbar-grok-1.4-favorito.txt` | Minificado e favorito pronto (`javascript:...`) |
| `index.html`, `carimbar-grok-1.4-instalar.html` | Página de instalação da 1.4 (com a aba SoulMV) |
| `build-grok-1.4.cjs` | Gera min, favorito e páginas da 1.4 (`node build-grok-1.4.cjs`) |
| `testes-mv/`, `e2e-grok-1.4.mjs`, `e2e-grok-1.4-paginas.mjs` | Páginas locais que imitam o MV PEP (iframe, aninhado, frameset, outro site, editor rico, shadow DOM; dados fictícios) e os testes em Chrome |
| `unit-tests-comparativo-1.4.cjs` | Roteiro comparativo com a expectativa do teste 48 trocada para o modo genérico |
| `carimbar-grok-1.3*`, `build-grok-1.3.cjs` | Arquivos da 1.3 |
| `unit-tests-grok-1.3.cjs` | Testes da conferência do paciente, da fila e do EXTRAIR |
| `carimbar-grok-1.2*`, `build-grok-1.2.cjs`, `carimbar-grok-1.1*`, `build-grok-1.1.cjs` | Arquivos da 1.2 e da 1.1 |
| `ponte.html`, `ponte.js`, `vendor/supabase-js-2.119.0.js`, `vendor/qrcode-generator-1.4.4.js` | Janela-ponte com pareamento por QR (bibliotecas fixadas e servidas pelo próprio site) |
| `enviar.html`, `enviar.js`, `enviar-parse.js` | Página do celular: pareamento, colar/link, prévia por paciente e envio de um ou vários JSONs |
| `GROK-INSTRUCOES.md`, `grok-instrucoes.txt` | Como usar com o chat do Grok e o texto das instruções |
| `unit-tests-enviar.cjs` | Testes da página do celular |
| `supabase/carimbar.sql` | Tabela, funções, aviso em tempo real e limpeza de 24 h |
| `unit-tests-comparativo.cjs`, `unit-tests-grok-v2.cjs`, `unit-tests-grok-1.1.cjs` | Testes em jsdom |
| `versoes/1.0/` a `versoes/1.3/` | Versões congeladas (páginas de instalação funcionando) |
| `carimbar-grok.js`, `carimbar-grok.min.js`, `carimbar-grok-favorito.txt`, `carimbar-grok-instalar.html`, `build-grok.cjs` | Arquivos da 1.0 mantidos na raiz |

## Testes 1.4 (09/11/2026)

- **jsdom, favorito 1.4 (fonte e minificado, mesmos números):** roteiro comparativo 75/75 (com o teste 48 trocado para o modo genérico, ver mudanças), roteiro v2 30/30, nuvem 24/24, testes da 1.3 21/21. Página do celular 30/30.
- **Chrome headless com páginas que imitam o MV PEP (`testes-mv/`, favorito minificado), 12/12:** iframe da mesma origem (preenche por rótulo, eventos chegam ao "modelo" ExtJS/GWT, paciente conferido, destaque); chave pelo `name` e EXTRAIR com o quadro; ENVIAR P/ IA com ponte local de teste (campos com `quadro`, `chave`, `pacienteNaTela`, `quadros`) e carimbo da "nuvem" aplicado no quadro; iframe aninhado com o paciente em outro quadro (José na tela da Maria: nada preenchido, aviso exato); fila José/Maria em quadros; frameset (barra no quadro principal, paciente no cabeçalho); quadro de outro site ignorado e contado; só quadro de outro site (alerta); editor rico em iframe e campo em shadow DOM; duas caixas de texto (pede clique; depois do clique vai para a certa); antropometria da 1.3 dentro de iframe; botão CAMPOS.
- **Páginas:** aba SoulMV copia o código com e sem `javascript:` (igual ao favorito); `enviar.html` aceita `campos` e copia cada texto e o paciente inteiro. 2/2.
- **Nuvem real, contra o site publicado (favorito tirado da página ao vivo, ponte ao vivo, Supabase):** página local com o formulário num iframe → ENVIAR P/ IA gravou a extração (tipo `generico`, 5 campos com `quadro` e `chave`, paciente "JOSÉ TESTE FICTÍCIO", `quadros` 1/0) → `carimbar.responder` com `campos` e `evolucao` → o quadro se preencheu (4 campos) com "Paciente conferido". Dados fictícios; as linhas de teste somem sozinhas em 24 h.
- **Não testado:** o navegador do SoulMV e o MV PEP real (não há acesso daqui); colar o código na barra de endereço ou no editor de favoritos de um navegador real; CKEditor 4/TinyMCE reais.

## Testes 1.3 (09/11/2026)

- **jsdom, favorito 1.3 (fonte e minificado, mesmos números):** roteiro comparativo 75/75, roteiro v2 30/30, nuvem 24/24 e testes novos da 1.3 21/21. Nenhum teste antigo foi alterado.
  - Os 21 novos cobrem: detecção do paciente nas 4 páginas de atendimento capturadas (prescrição, exames, antropometria, evolução: "Anary Simon"); José confere; José × Maria não preenche nada e mostra o aviso exato; acentos/maiúsculas; nome parcial; não identificado (os dois botões funcionando); cadastro novo; cadastro existente; JSON sem paciente; fila com dois pacientes, nome mais específico, reenvio substitui, limpar fila; chegada pela nuvem de outro paciente (fica na fila); prontuário diferente; nomes em conflito; modelo "Paciente: Nome Idade Sexo" ignorado; EXTRAIR com valores digitados (input, número, textarea, select, checkbox, radio; senha fora); ENVIAR P/ IA com sinais vitais e exames digitados.
- **jsdom, versões congeladas:** 1.2 e 1.1 (fonte e minificado) 75/75, 30/30, 24/24.
- **Página do celular:** 30/30 (23 da 1.2 + 7 novos de vários blocos, prévia por paciente, envio em sequência, lote sem paciente bloqueado, erro no meio do lote).
- **Ponta a ponta em Chrome (local, ponte e celular locais, Supabase real):**
  - Tela do José recebe o JSON do José pelo celular: preencheu 4 campos em 1,0 s, "Paciente conferido".
  - Tela da Maria recebe o JSON do José: nada preenchido, aviso exato, JSON na fila.
  - Colagem com José e Maria, tela da Maria aberta: Maria preenchida (1,3 s); depois a tela do José, CARIMBAR: José preenchido pela fila.
  - Regressão do caminho da 1.2 (JSON sem paciente): cadastro 1,0 s (3,8 s com listas), antropometria por link 0,6 s, evolução 0,6 s, só consulta de reserva 2,7 s. Caminho do robô (`carimbar.responder` com `paciente`): preencheu e conferiu.
- **Contra o site publicado (favorito tirado da página ao vivo, ponte e `enviar.html` ao vivo, celular emulado iPhone 13):**
  - A: tela do José recebe o JSON do José: preencheu em 0,7 s, "Paciente conferido: José = José Carlos Pereira Fictício".
  - B: tela da Maria recebe o JSON do José: nenhum campo preenchido; "Este JSON é do paciente José, mas a tela aberta é de Maria Souza Fictícia. Nada foi preenchido."; JSON na fila.
  - C: uma colagem com José e Maria ("ENVIAR OS 2"): a tela da Maria preencheu os dados da Maria em 1,3 s; a tela do José, com "Fila: José, Maria", preencheu os do José.
  - Regressão: cadastro 0,8 s (3,6 s com listas), antropometria por link 0,4 s, evolução 0,4 s, só consulta de reserva 2,6 s; favorito 1.2 congelado com a ponte nova 0,7 s; robô com `paciente` preencheu e conferiu.
- Linhas de teste apagadas do banco depois dos testes.

## Testes 1.2 (09/11/2026)

- **jsdom (1.2):**
  - Favorito: 75/75 no roteiro comparativo, 30/30 no roteiro v2 e 24/24 nos testes da nuvem. O minificado tem o mesmo resultado.
  - Página do celular: 23/23. Cobre bloco ``` com texto em volta, JSON no meio de texto, #j= base64url, #t=, entradas inválidas, chaves desconhecidas, aspas tipográficas, pareamento removendo o código da URL, envio, erro, Colar, desparear e link aberto com a página já aberta.
- **Ponta a ponta em Chromium real (1.2)**, com um contexto "hospital" (página de teste com o favorito e a ponte) e um contexto "celular" emulado (iPhone 13):
  - O celular pareou pelo QR (QR decodificado igual ao link, código removido da URL).
  - Colou a resposta do Grok com texto em volta e enviou. A página preencheu 16 campos do cadastro em cerca de 1 s (3,8 s com as listas).
  - O link #j= preencheu a antropometria (26 campos) em 0,7 s.
  - Só com a consulta de reserva (Realtime bloqueado), a evolução preencheu em 2,6 s.
- **Contra o site publicado (favorito tirado da página ao vivo):**
  - Pareamento pelo QR, depois colar → cadastro (16 campos) em 0,8 s (3,6 s com as listas).
  - Link #j= → antropometria (26 campos) em 0,9 s.
  - Colar → evolução em 0,4 s.
  - Só consulta de reserva: 2,5 s.
  - O favorito 1.1 com a ponte nova também preencheu (0,7 s), e o caminho do robô (`carimbar.responder`) em 0,5 s.
- **Segurança da 1.2 com a chave pública:**
  - Código desconhecido é recusado e código inválido também.
  - Lista e conteúdo acima de 50 KB são recusados.
  - O limite de 60 envios por hora barra o 61º.
  - Não há acesso direto às tabelas.

```
CARIMBAR_FILE=carimbar-grok-1.4.js node unit-tests-grok-1.1.cjs
CARIMBAR_FILE=carimbar-grok-1.4.js node unit-tests-grok-1.3.cjs
node unit-tests-enviar.cjs
# páginas que imitam o MV (duas origens) e o teste em Chrome
(cd testes-mv && python3 -m http.server 8801 --bind 127.0.0.1 &) ; (cd testes-mv && python3 -m http.server 8802 --bind 127.0.0.1 &)
node e2e-grok-1.4.mjs carimbar-grok-1.4-favorito.txt
```

## Observações

- Deixe a janela-ponte aberta. Se o navegador bloquear a janela, permita pop-ups para o site do sistema.
- Confira sempre os campos antes de salvar no sistema.
- Fase de teste: não distribua sem revisão.
