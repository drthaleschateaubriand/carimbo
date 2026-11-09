# CARIMBAR — versão Grok: lista de mudanças

- Original preservado: `carimbar.js` (SHA-256 `f59e1c1c57aaf819c2fc993942af17ca2129333a2adfd4613bb9f986558bbccf`, igual antes e depois).
- Versão Grok: `carimbar-grok.js` (comentário `CARIMBAR - versao Grok` no topo).
- Na v1/v2, a chave do texto no sessionStorage e o id da barra eram os mesmos do original; desde a v2.1 eles foram renomeados (ver seção v2.1). A chave `__thales_extractor__` (localStorage), os botões, as cores e as mensagens da missão não mudaram.
- Os números de linha abaixo se referem ao `carimbar.js` original.

| # | Linha original | O que era | O que mudou na Grok |
|---|---|---|---|
| 1 | 25–33, 391 | `updateStatus` procurava o elemento de status pelo id no documento antes de a barra ser anexada; por isso o status começava vazio. | Usa a referência direta do elemento de status e é chamada de novo depois de anexar a barra. O status inicial aparece como "Sem dados \| Nada extraido". |
| 2 | 331–342 | INSERIR TEXTO apagava o texto salvo no sessionStorage antes de abrir a caixa, então CANCELAR perdia o texto anterior. | O texto anterior só é substituído quando o usuário dá OK com texto novo. CANCELAR, ou OK com a caixa vazia, mantém o texto anterior. |
| 3 | 94–96 | Sobrescrevia `document.onmousemove` e `document.onmouseup` da página. | Usa `addEventListener`, e o X remove todos os listeners da ferramenta. Os handlers da própria página continuam funcionando. |
| 4 | 10, 98–101 | `touch-action:none` na barra inteira e `preventDefault` em qualquer toque fora dos botões, o que impedia rolar a barra em tela pequena. | `touch-action:none` fica só na linha de cima (status, botões e rótulo Grok). O arraste por toque começa pela linha de cima ou pela borda da barra. A linha AVANCADO e o resumo ficam livres para rolagem interna. O arraste por mouse continua valendo na barra inteira. |
| 5 | 365–381 | COPIAR anunciava "Copiado" mesmo quando a cópia falhava, porque o `writeText` de reserva é assíncrono e as falhas eram ignoradas. | Aguarda a Promise do clipboard. Só mostra "Copiado: N pagina(s)." quando a cópia deu certo. Se falhar, avisa e abre uma caixa com o texto selecionado para cópia manual. Sem páginas extraídas, avisa "Nada extraido para copiar.". |
| 6 | 347–348 | Uma regex removia o bloco `cdk-describedby-message-container`: falhava se `id` viesse antes de `class` e cortava errado com divs aninhadas. | Remoção via DOM num clone do `body` (`.cdk-describedby-message-container`, `script` e a própria barra). O HTML extraído fica íntegro. |
| 7 | 194–202 | A comparação de opções do mat-select era sensível a acentos e espaços extras. | Tenta primeiro a igualdade exata, ignorando maiúsculas. Depois tenta uma comparação normalizada: sem acentos, espaços colapsados e `trim`. Procura no painel indicado por `aria-controls` quando ele existe e espera até cerca de 1,6 s pelas opções (mínimo de 400 ms, como antes). Se não acha a opção, fecha a lista (Escape + clique) e registra no resumo. |
| 8 | 236–242 | `matCheck` só lia a classe antiga `mat-checkbox-checked` e clicava no host. Com o Angular Material MDC (`mat-mdc-checkbox-checked`), o estado era lido errado e o clique podia não alternar nada. | Lê o estado pelo input checkbox interno. Se não houver, usa as classes antiga e nova ou `aria-checked`. Clica no input interno e confere o resultado. Também aceita `input[type=checkbox][name=isMinor]` nativo. |
| 9 | 241, 284–287 | `!!v`: a string `"false"` virava true. `especial:false` nunca desmarcava uma caixa já marcada. | `toBool` entende `false`/`"false"`/`"nao"`/`"0"` etc. `menorDeIdade` e `especial` levam a caixa ao estado pedido, marcando ou desmarcando. Quando a chave está ausente no JSON, a caixa não é tocada. |
| 10 | 218–224 | `ck()` usava sempre o primeiro `.ck-editor__editable` da página. | Escolhe entre os editores com instância: descarta os ocultos e os somente-leitura. Restringe ao contexto quando ele existe (`#evolution-template` na evolução, o mesmo `<form>` do `special` na prescrição). Usa o editor em que o usuário tocou ou clicou por último (focusin). Se ainda houver mais de um candidato, **não escreve** e avisa: "Ha N editores... toque dentro do editor que deve receber o texto e toque CARIMBAR de novo". Mudança de comportamento intencional: evita escrever no campo errado. |
| 11 | 150–158 | A detecção por ordem fixa e única fazia, por exemplo, `description` + `special` ser sempre evolução, mesmo com JSON só de prescrição (resultado: "Chave evolucao nao encontrada."). | Lista todos os tipos detectados, na mesma ordem da original, e escolhe o primeiro cujo JSON tem chaves daquele tipo. Com JSON completo, o resultado é igual ao da original. O resumo informa quando a página também parecia outro tipo. A regra do Memed não mudou. |
| 12 | 180–186, 244–323, 325–327 | Chave sem campo na página era ignorada em silêncio. | Ao final do CARIMBAR, um resumo **dentro da barra**, sem alert, mostra o tipo, quantos campos foram preenchidos, "Sem campo na pagina: ...", "Opcao nao encontrada: ..." e caixas que não puderam ser marcadas. Um botão "ok" fecha o resumo. Chaves de outros tipos (ex.: `altura` numa página de cadastro) não são listadas. |
| 13 | 181, 188 | `t()` aceitava 0, mas `ta()`, `sel()`, `ckByName()` e `dt()` descartavam 0 por usar `if(!v)`. | Todas usam `has(v)`: só ignoram `undefined`, `null` e `""`. O valor 0 é aplicado como "0". |
| 14 | 174, 182–184 | `t()` usava o setter de `HTMLInputElement` em qualquer elemento com aquele `name`. Num `textarea` isso gerava TypeError e interrompia o CARIMBAR. | Procura `input`/`textarea`/`select` e usa o setter nativo do tipo certo. Continua disparando input, change e blur. |
| 15 | 223, 234 | `setData` recebia texto puro. Como o CKEditor 5 interpreta o texto como HTML, as quebras de linha da prescrição e da evolução provavelmente viravam um parágrafo só. | Texto sem tags HTML é escapado (`& < >`) e cada linha vira um `<p>`. Texto que já tem HTML é enviado como está. **Não confirmado em CKEditor real** (teste com dublê). |
| 16 | 2 / barra | Não havia como saber qual versão estava em uso. | Pequeno rótulo "Grok" (9 px, cinza) na linha de cima, com tooltip "CARIMBAR - versao Grok", e `data-versao="grok"` na barra. |
| 17 | 85–92 | O arraste podia levar a barra para fora da tela. | A posição fica limitada à área visível da janela. |
| 18 | 5 | `getExtracted` podia devolver algo que não era lista se o storage tivesse outro conteúdo. | Garante uma lista. |

## Efeitos colaterais conhecidos

- No celular, a linha AVANCADO e o resumo não arrastam mais a barra. O arraste por toque fica na linha de cima, fora dos botões, ou na borda da barra.
- Com vários editores CKEditor visíveis e sem toque prévio num deles, a Grok pede para o usuário escolher o editor em vez de preencher o primeiro.
- O HTML extraído pelo EXTRAIR não inclui mais a própria barra do CARIMBAR.
- Se a barra da versão original estiver aberta, a Grok não abre: feche com o X antes de trocar de versão. Na v1/v2 o contrário também valia; desde a v2.1 a Grok usa um id próprio, então o original não detecta a barra Grok.

## Verificação

Os testes rodaram com Node + jsdom, sem navegador. O mesmo harness (`unit-tests-comparativo.cjs`, 75 casos) foi executado nas duas versões:

- Original: 48 passaram e 27 falharam.
- Grok: 75 passaram e 0 falharam.
- Grok minificada, decodificada do favorito: 75 passaram e 0 falharam.

O caso 71 (identificação "Grok") só se aplica à nova versão. Detalhes em `resultados-original.json` e `resultados-grok.json`.

---

# Versão Grok v2 (09/11/2026)

Corrige as falhas encontradas nos testes em sistema real. A v1 foi preservada em `carimbar-grok-v1.js` (e `-v1` nos arquivos min, favorito e instalar). O original `carimbar.js` não foi tocado (SHA-256 `f59e1c1c…bbccf`, conferido). Os números de linha abaixo se referem ao novo `carimbar-grok.js` (666 linhas).

| # | Linhas (v2) | Problema real | O que mudou |
|---|---|---|---|
| 1 | 266–275, 364–367, 376–383, 425–432 | Os campos de data do sistema são `input[type=date]` e só aceitam `AAAA-MM-DD`. O JSON manda `22/07/1978`, então Nascimento e a data da avaliação ficavam vazios. | `toIsoDate` converte `DD/MM/AAAA`, `DD-MM-AAAA` e `D/M/AAAA` para `AAAA-MM-DD` e aceita valores já em ISO. A conversão só acontece quando o campo é `type=date`; campos de texto (por exemplo, a data do Memed) mantêm o formato original. O valor continua sendo gravado com o setter nativo, disparando input, change e blur. |
| 2 | 357–363, 376–432, 434–465, 587 | A barra contava "preenchidos" mesmo quando o campo recusava o valor. Na Rodada 5 apareceu "preenchidos: 9", mas a data estava vazia. | `t()`, `ta()`, `nsel()` e `dt()` só contam o campo quando ele ficou com valor. Num select, isso quer dizer uma opção selecionada e não vazia. Se o campo recusar, a barra mostra "Nao preenchido (campo recusou o valor): chave (valor)". Nos editores, a contagem só é verificada quando o editor expõe `getData()`. |
| 3 | 277–297, 404 | A etnia "Branca" não casava com "BRANCO". | Primeiro tenta a igualdade exata, depois a comparação sem acentos e espaços. Para a etnia, usa um mapa de sinônimos (Branca/Branco→BRANCO, Preta/Negra→PRETO, Parda→PARDO, Amarela→AMARELO, Indígena/Índia→ÍNDIO, Não informada→NÃO INFORMADO). Por último, para qualquer mat-select, compara o radical sem o a/o final, mas só aceita se exatamente uma opção casar. |
| 4 | 304–322, 526–541 | Na prescrição em modo estruturado (o padrão do sistema) não existe editor: a v1 disparava um alert e não preenchia nada. | Se não houver editor pronto, procura a aba "Texto livre" (`[role=tab]`, `.mat-mdc-tab`, `.mat-tab-label`, `button`, `a`). A ordem de busca é: texto exatamente igual; aba que contém o texto; botão ou link curto (até 40 caracteres) que contém o texto. Ao achar, clica e espera até cerca de 3 s pelo editor. A barra mostra "Aba Texto livre aberta automaticamente". Se o editor não aparecer, mostra na barra "Abra a aba Texto livre e clique CARIMBAR de novo", sem alert. A caixa Controle Especial é procurada só depois da troca de aba. |
| 5 | 571 | No aviso de campo ausente, o rótulo da coxa era `cThigh`, e não a chave do JSON. | O rótulo passou a ser `cCoxa`. O preenchimento já funcionava. |
| 6 | 7, 70 | — | O rótulo da barra e a dica (tooltip) mostram "Grok v2". O cabeçalho `/* CARIMBAR - versao Grok` foi mantido. A página de instalação também cita "Grok v2". |

## Mudança de comportamento intencional

- Prescrição sem editor e sem a aba Texto livre: a v1 mostrava o alert "Editor nao encontrado."; a v2 mostra a mensagem na barra. Por isso o caso 58 de `unit-tests-comparativo.cjs` passou a esperar a mensagem na barra quando o código é a v2. Para o original e a v1, o caso continua esperando o alert.

## Verificação (jsdom, sem navegador)

| Roteiro | v2 | v2 minificada (favorito) | v1 | Original |
|---|---|---|---|---|
| `unit-tests-comparativo.cjs` (75 casos) | 75/75 | 75/75 | 75/75 | 48/75 (inalterado) |
| `unit-tests-grok-v2.cjs` (24 casos novos) | 24/24 | 24/24 | 3/24 (os novos testes detectam as falhas da v1) | — |

Ainda falta confirmar no sistema real: o clique automático na aba Texto livre (os seletores foram deduzidos dos prints; o Angular pode precisar de mais de 3 s para criar o editor), a etnia BRANCO e as datas.

---

# Versão Grok v2.1 (09/11/2026) — nome genérico

A ferramenta preenche formulários de qualquer sistema web e extrai o conteúdo de qualquer página, por isso o nome do sistema usado nos testes saiu do produto.

- **Ids renomeados:** barra `carimbarBar`, resumo `carimbarResumo`, status `carimbarStatus`, rótulo de versão `carimbarVersao`.
- **Chave do texto colado:** `carimbarJSON` (sessionStorage). A chave `__thales_extractor__` (localStorage) não mudou.
- **Migração sem perda:** ao abrir, se `carimbarJSON` estiver vazia e a chave antiga existir, o texto é copiado para a nova chave e a antiga é removida. Se as duas existirem, a nova é mantida e a antiga fica intocada. No código, a chave antiga é montada por partes, numa única linha com o comentário `chave antiga`.
- **Sem duas barras:** a barra não abre se já existir a barra Grok ou a barra com o id antigo (versão original). Nesse caso não há migração, para não tirar o texto que o original ainda usa.
- **EXTRAIR:** remove do HTML extraído tanto a barra Grok quanto a barra com o id antigo.
- **Números de linha:** o arquivo passou de 666 para 679 linhas. Os números da tabela v2 acima deslocam +13 (exemplo: `toIsoDate` agora começa na linha 279, e o rótulo `cCoxa` está na 584).
- **Comentário de cabeçalho genérico.** O cabeçalho `/* CARIMBAR - versao Grok` foi mantido, e a página de instalação passou a usar texto genérico.

## Testes v2.1 (jsdom)

| Roteiro | Grok v2.1 | Grok v2.1 minificada (favorito) | Original |
|---|---|---|---|
| `unit-tests-comparativo.cjs` (75 casos) | 75/75 | 75/75 | 48/75 (inalterado) |
| `unit-tests-grok-v2.cjs` (30 casos) | 30/30 | 30/30 | — |

Os roteiros usam a chave e os ids novos quando o código é a Grok v2.1, e os antigos quando é o original ou a v1. Novos casos v21-01 a v21-06:
- migração da chave antiga;
- a migração não sobrescreve a chave nova;
- não abre com a barra antiga/original aberta;
- não abre duas barras;
- EXTRAIR remove as duas barras;
- nenhuma ocorrência do nome antigo no código nem na barra.

# Versão Grok 1.1 (09/11/2026): com nuvem

A versão anterior (código interno "Grok v2.1") passa a se chamar **Grok 1.0** e fica congelada em `versoes/1.0/` (tag `grok-1.0`).

## O que mudou

- **Botão ENVIAR P/ IA:** monta um resumo compacto dos campos da página e o envia à IA pela janela-ponte. Para cada campo vão o name/formcontrolname/id, o rótulo, o tipo, o valor atual, as opções (select, ou mat-select quando aberto) e o estado das caixas. Também vão os editores de texto, os tipos detectados e as chaves do CARIMBAR. Nas telas capturadas o resumo ficou entre 0,5 e 3 KB, contra cerca de 500 KB do HTML. Hidden e valores de senha nunca entram.
- **Recebimento automático:** quando o JSON da IA chega pela ponte, ele é salvo em `carimbarJSON` e o mesmo CARIMBAR da 1.0 roda sozinho. A barra mostra "Recebido da IA" e o resumo. Carimbos seguidos vão para uma fila e são aplicados um de cada vez.
- **Indicador "IA:"** na barra: conectando, aguardando a IA, carimbando, carimbo aplicado, erro, janela bloqueada.
- **Rótulo** "Grok 1.1".
- **Preenchimento, EXTRAIR, COPIAR e LIMPAR:** sem mudanças.

## Segurança da conversa entre janelas

- O favorito não acessa a rede. Só a janela-ponte (`ponte.html`, no GitHub Pages) fala com o Supabase, e ela tem CSP restrita ao projeto.
- O favorito só aceita mensagens da janela que ele abriu e da origem `https://drthaleschateaubriand.github.io`, e só envia para essa origem.
- A ponte só aceita mensagens de `window.opener` e responde só para a origem informada pelo navegador no aperto de mão. O aviso "pronta" não leva dados.
- O endereço da ponte só pode ser trocado (`window.CARIMBAR_PONTE_URL`) para `http://localhost`, para testes.

## Testes 1.1

- jsdom: 75/75 (comparativo), 30/30 (v2) e 24/24 (novos da nuvem), no fonte e no minificado.
- Chromium real ponta a ponta (cadastro, antropometria e evolução), com a ponte local e com a publicada, em tempo real e só com a consulta de reserva.
- Os testes `unit-tests-comparativo.cjs` e `unit-tests-grok-v2.cjs` passaram a aceitar o rótulo "Grok 1.x" além de "Grok v2". O teste do rótulo e o teste da mensagem da aba Texto livre dependiam do texto da versão.

# Versão Grok 1.2 (09/11/2026): chat comum do Grok + celular

A 1.1 fica congelada em `versoes/1.1/` (tag `grok-1.1`).

## O que mudou

- **Favorito:** só o rótulo, agora "Grok 1.2". Preenchimento, extração e conversa com a ponte iguais à 1.1. O favorito da 1.1 continua funcionando com a ponte nova.
- **Janela-ponte:**
  - Registra a sessão na nuvem ao abrir (`carimbar_registrar`).
  - Ganhou "📱 Parear celular / outro aparelho", com QR (qrcode-generator 1.4.4, servido pelo próprio site) e link `enviar.html#parear=<código>`.
  - "Começar nova sessão" desfaz os pareamentos.
- **Página do celular `enviar.html`:**
  - Pareia uma vez: guarda o código no aparelho e o tira da barra de endereço na hora. Tem a opção Desparear.
  - Aceita o JSON colado (botão Colar ou colar manual), inclusive dentro de bloco ``` ou com texto em volta, e também os links `#j=` (base64url) e `#t=` (encodeURIComponent).
  - Mostra a prévia por tela, avisa sobre chaves desconhecidas e JSON inválido, envia, e mostra a hora do envio ou o erro.
- **Supabase:** a função `carimbar_responder_app(codigo, conteudo)` grava o "carimbo" só para sessão existente, só objeto JSON, até 50 KB e até 60 por hora. Ela dispara o mesmo aviso em tempo real e a mesma consulta da 1.1. A tabela `carimbar.sessoes_pareadas` fica sem acesso direto e é limpa após 30 dias sem uso.
- **Instruções para o Grok:** `GROK-INSTRUCOES.md` e a seção "Usar com o chat do Grok" na página de instalação.

## Testes 1.2

- Favorito (fonte e minificado): jsdom 75/75, 30/30 e 24/24. O teste da nuvem passou a ler o rótulo esperado do próprio arquivo.
- Página do celular: jsdom 23/23.
- Ponta a ponta em Chromium real (contexto hospital + contexto celular emulado): pareamento por QR, colar com texto em volta, link #j= e só consulta de reserva.

# Versão Grok 1.3 (09/11/2026): conferência do paciente

A 1.2 fica congelada em `versoes/1.2/` (tag `grok-1.2`).

## O que mudou

- **Favorito:**
  - Lê o paciente da tela (cabeçalho/cartão do paciente, janela aberta "Paciente: …", campo nome preenchido, rótulos "Paciente"/"Nome", título da página) e o prontuário, e mostra "Paciente na tela: …" na barra.
  - Só preenche se o `paciente` do JSON conferir com a tela (sem maiúsculas/acentos; todas as palavras ditadas presentes; o mais específico vence; prontuário precisa bater quando os dois existem).
  - Outro paciente: "Este JSON é do paciente X, mas a tela aberta é de Y. Nada foi preenchido." Não identificado: "Preencher mesmo assim" / "Cancelar". Cadastro novo: sem conferência, `paciente` vira o nome. Sem `paciente`: como na 1.2, com aviso.
  - Fila de pacientes na aba (`carimbarFila`), com "Fila: José, Maria" e "limpar fila". INSERIR TEXTO aceita vários JSONs de uma vez.
  - Pela nuvem: JSON de outro paciente fica na fila, o resumo anterior continua visível e o rótulo da IA diz "outro paciente, nada preenchido".
  - EXTRAIR grava no HTML copiado os valores digitados (value, texto das caixas, selected, checked); senha fica de fora.
  - ENVIAR P/ IA inclui `pacienteNaTela`.
- **`enviar.html`:** vários blocos JSON numa colagem, prévia por paciente, envio de todos em sequência; bloqueia lote com JSON sem paciente; avisa paciente repetido.
- **Instruções do Grok:** sempre `paciente`, `prontuario` quando ditado, perguntar se o nome não foi dito, um bloco por paciente.
- **Robôs (`IA-COMO-RESPONDER.md`):** incluir `paciente`; uma chamada `carimbar.responder` por paciente.
- **Ponte:** só o rótulo. Banco: sem mudanças.

## Testes 1.3

Ver README, seção "Testes 1.3". As suítes antigas passaram sem mudar nenhum teste.

## Grok 1.4 (09/11/2026): telas em quadros (MV PEP) e modo genérico

Motivo: no MV PEP ("PEP » Transição de Cuidados") a 1.3 rodou mas não achou nada (campos [], editores [], pacienteNaTela null), porque a tela é montada dentro de quadros (iframes). E o navegador próprio do SoulMV não tem barra de favoritos.

| # | O que era (1.3) | O que mudou (1.4) |
|---|---|---|
| 1 | Buscava campos, editores e o paciente só no documento principal. | Percorre recursivamente todos os `iframe`/`frame` acessíveis (mesma origem), inclusive `frameset` e quadros aninhados, e o shadow DOM aberto. Vale para preencher, extrair, achar o paciente, ENVIAR P/ IA e CAMPOS. |
| 2 | Quadro de outro site passava despercebido. | O navegador não deixa ler quadros de outro site. A barra mostra "Quadros lidos: N \| de outro site, ignorados: M", o resumo enviado à IA leva `quadros`, e o EXTRAIR anota no HTML. Sem nenhum campo legível, o alerta diz quantos quadros de outro site existem. |
| 3 | Página com `frameset` não mostraria a barra. | A barra vai para o maior quadro acessível. |
| 4 | Página sem tipo conhecido: "Nenhum formulario reconhecido." | Modo **genérico**: preenche pela chave do JSON comparada com `name`, `id`, `formcontrolname`, `aria-label`, `placeholder` e rótulo do campo (label, item ExtJS, célula anterior da tabela). Aceita `{"campos": {"rótulo": "valor"}}`. Textos (`evolucao`, `texto`…) vão para a caixa clicada por último ou para a única caixa da tela; com várias e sem clique, não escreve e pede o clique. Mudança intencional: o teste 48 do roteiro comparativo (que esperava o alerta numa página com `<input name="username">`) passa a ver a caixa pedindo o JSON; o roteiro `unit-tests-comparativo-1.4.cjs` é o original com só essa expectativa trocada. |
| 5 | Eventos: input, change, blur. | focus, focusin, keydown, input, keyup, change, blur (borbulha, como antes) e focusout, criados com a janela do próprio quadro, para ExtJS/GWT/Angular perceberem o valor. Setter nativo do quadro (não da página principal). |
| 6 | Só CKEditor 5. | Também `contenteditable`, corpos de editor em iframe (`designMode`/`contenteditable`) e, se existirem, CKEditor 4 e TinyMCE pela API deles. Evolução numa página com `name="description"` sem CKEditor vai para a caixa de texto comum. |
| 7 | Sem destaque. | Campos preenchidos ficam com contorno verde por 8 s. Novo botão **AVANCADO > CAMPOS**: contorno azul nos campos visíveis e lista das chaves por quadro. O destaque não entra no EXTRAIR. |
| 8 | ENVIAR P/ IA. | Cada campo leva `quadro` (quando está em quadro) e, no tipo genérico, `chave`; `chavesCarimbar.generico` lista as chaves; editores ricos entram em `editores` com `rico: true`. |
| 9 | `enviar.html`. | Aceita `"campos"` (seção "Campos do formulário"). Cada texto da prévia tem **Copiar**, e cada paciente tem **Copiar tudo deste paciente**, para colar com Ctrl+V onde o favorito não roda (navegador do SoulMV). Copiar não exige pareamento. |
| 10 | Página de instalação: Chrome e Safari. | Nova aba **SoulMV / navegador do MV**: copiar o código (com e sem `javascript:`), caixa com o código para Ctrl+A/Ctrl+C, abrir o MV no Chrome/Edge, e o caminho sem favorito pela `enviar.html`. |
