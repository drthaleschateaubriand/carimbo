# CARIMBAR — versão Grok: lista de mudanças

- Original preservado: `carimbar.js` (SHA-256 `f59e1c1c57aaf819c2fc993942af17ca2129333a2adfd4613bb9f986558bbccf`, igual antes e depois).
- Versão Grok: `carimbar-grok.js` (comentário `CARIMBAR - versao Grok` no topo).
- As chaves de armazenamento (`clinivJSON` em sessionStorage e `__thales_extractor__` em localStorage), o id `clinivBar`, os botões, as cores e as mensagens da missão não mudaram.
- Os números de linha abaixo se referem ao `carimbar.js` original.

| # | Linha original | O que era | O que mudou na Grok |
|---|---|---|---|
| 1 | 25–33, 391 | `updateStatus` procurava `#clinivStatus` no documento antes de a barra ser anexada; por isso o status começava vazio. | Usa a referência direta do elemento de status e é chamada de novo depois de anexar a barra. O status inicial aparece como "Sem dados \| Nada extraido". |
| 2 | 331–342 | INSERIR TEXTO apagava `clinivJSON` antes de abrir a caixa, então CANCELAR perdia o texto anterior. | O texto anterior só é substituído quando o usuário dá OK com texto novo. CANCELAR, ou OK com a caixa vazia, mantém o texto anterior. |
| 3 | 94–96 | Sobrescrevia `document.onmousemove` e `document.onmouseup` da página. | Usa `addEventListener`, e o X remove todos os listeners da ferramenta. Os handlers da própria página continuam funcionando. |
| 4 | 10, 98–101 | `touch-action:none` na barra inteira e `preventDefault` em qualquer toque fora dos botões, o que impedia rolar a barra em tela pequena. | `touch-action:none` fica só na linha de cima (status, botões e rótulo Grok). O arraste por toque começa pela linha de cima ou pela borda da barra. A linha AVANCADO e o resumo ficam livres para rolagem interna. O arraste por mouse continua valendo na barra inteira. |
| 5 | 365–381 | COPIAR anunciava "Copiado" mesmo quando a cópia falhava, porque o `writeText` de reserva é assíncrono e as falhas eram ignoradas. | Aguarda a Promise do clipboard. Só mostra "Copiado: N pagina(s)." quando a cópia deu certo. Se falhar, avisa e abre uma caixa com o texto selecionado para cópia manual. Sem páginas extraídas, avisa "Nada extraido para copiar.". |
| 6 | 347–348 | Uma regex removia o bloco `cdk-describedby-message-container`: falhava se `id` viesse antes de `class` e cortava errado com divs aninhadas. | Remoção via DOM num clone do `body` (`.cdk-describedby-message-container`, `script` e a própria barra `#clinivBar`). O HTML extraído fica íntegro. |
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
- A Grok usa o mesmo id `clinivBar`. Se a barra da versão original estiver aberta, a Grok não abre (e o contrário também vale): feche com o X antes de trocar de versão.

## Verificação

Os testes rodaram com Node + jsdom, sem navegador. O mesmo harness (`unit-tests-comparativo.cjs`, 75 casos) foi executado nas duas versões:

- Original: 48 passaram e 27 falharam.
- Grok: 75 passaram e 0 falharam.
- Grok minificada, decodificada do favorito: 75 passaram e 0 falharam.

O caso 71 (identificação "Grok") só se aplica à nova versão. Detalhes em `resultados-original.json` e `resultados-grok.json`.

---

# Versão Grok v2 (09/11/2026)

Corrige as falhas encontradas nos testes reais no CliNiv. A v1 foi preservada em `carimbar-grok-v1.js` (e `-v1` nos arquivos min, favorito e instalar). O original `carimbar.js` não foi tocado (SHA-256 `f59e1c1c…bbccf`, conferido). Os números de linha abaixo se referem ao novo `carimbar-grok.js` (666 linhas).

| # | Linhas (v2) | Problema real | O que mudou |
|---|---|---|---|
| 1 | 266–275, 364–367, 376–383, 425–432 | Os campos de data do CliNiv são `input[type=date]` e só aceitam `AAAA-MM-DD`. O JSON manda `22/07/1978`, então Nascimento e a data da avaliação ficavam vazios. | `toIsoDate` converte `DD/MM/AAAA`, `DD-MM-AAAA` e `D/M/AAAA` para `AAAA-MM-DD` e aceita valores já em ISO. A conversão só acontece quando o campo é `type=date`; campos de texto (por exemplo, a data do Memed) mantêm o formato original. O valor continua sendo gravado com o setter nativo, disparando input, change e blur. |
| 2 | 357–363, 376–432, 434–465, 587 | A barra contava "preenchidos" mesmo quando o campo recusava o valor. Na Rodada 5 apareceu "preenchidos: 9", mas a data estava vazia. | `t()`, `ta()`, `nsel()` e `dt()` só contam o campo quando ele ficou com valor. Num select, isso quer dizer uma opção selecionada e não vazia. Se o campo recusar, a barra mostra "Nao preenchido (campo recusou o valor): chave (valor)". Nos editores, a contagem só é verificada quando o editor expõe `getData()`. |
| 3 | 277–297, 404 | A etnia "Branca" não casava com "BRANCO". | Primeiro tenta a igualdade exata, depois a comparação sem acentos e espaços. Para a etnia, usa um mapa de sinônimos (Branca/Branco→BRANCO, Preta/Negra→PRETO, Parda→PARDO, Amarela→AMARELO, Indígena/Índia→ÍNDIO, Não informada→NÃO INFORMADO). Por último, para qualquer mat-select, compara o radical sem o a/o final, mas só aceita se exatamente uma opção casar. |
| 4 | 304–322, 526–541 | Na prescrição em modo estruturado (o padrão do CliNiv) não existe editor: a v1 disparava um alert e não preenchia nada. | Se não houver editor pronto, procura a aba "Texto livre" (`[role=tab]`, `.mat-mdc-tab`, `.mat-tab-label`, `button`, `a`). A ordem de busca é: texto exatamente igual; aba que contém o texto; botão ou link curto (até 40 caracteres) que contém o texto. Ao achar, clica e espera até cerca de 3 s pelo editor. A barra mostra "Aba Texto livre aberta automaticamente". Se o editor não aparecer, mostra na barra "Abra a aba Texto livre e clique CARIMBAR de novo", sem alert. A caixa Controle Especial é procurada só depois da troca de aba. |
| 5 | 571 | No aviso de campo ausente, o rótulo da coxa era `cThigh`, e não a chave do JSON. | O rótulo passou a ser `cCoxa`. O preenchimento já funcionava. |
| 6 | 7, 70 | — | O rótulo da barra e a dica (tooltip) mostram "Grok v2". O cabeçalho `/* CARIMBAR - versao Grok` foi mantido. A página de instalação também cita "Grok v2". |

## Mudança de comportamento intencional

- Prescrição sem editor e sem a aba Texto livre: a v1 mostrava o alert "Editor nao encontrado."; a v2 mostra a mensagem na barra. Por isso o caso 58 de `unit-tests-comparativo.cjs` passou a esperar a mensagem na barra quando o código é a v2. Para o original e a v1, o caso continua esperando o alert.

## Verificação (jsdom, sem navegador)

| Roteiro | v2 | v2 minificada (favorito) | v1 | Original |
|---|---|---|---|---|
| `unit-tests-comparativo.cjs` (75 casos) | 75/75 | 75/75 | 75/75 | 48/75 (inalterado) |
| `unit-tests-grok-v2.cjs` (24 casos novos) | 24/24 | 24/24 | 3/24 (os novos testes detectam as falhas da v1) | — |

Ainda falta confirmar no CliNiv real: o clique automático na aba Texto livre (os seletores foram deduzidos dos prints; o Angular pode precisar de mais de 3 s para criar o editor), a etnia BRANCO e as datas.
