# CARIMBAR — Relatório final de testes (original × versão Grok)

Data: 09/11/2026, madrugada (horário de Recife, UTC−3). Versões: `carimbar.js` (original, feita no Claude, 391 linhas, **não alterada**, SHA-256 `f59e1c1c57aaf819c2fc993942af17ca2129333a2adfd4613bb9f986558bbccf` conferido no fim) e `carimbar-grok.js` (versão Grok, 597 linhas).

## 1. Resumo

**Testes unitários (jsdom, 75 casos, mesmo roteiro para as duas versões):** a original passou em 48 e falhou em 27. Um desses 27 é o caso 71 ("versão identificável"), que só vale para a Grok. A Grok passou nos 75, e a Grok minificada do favorito também passou nos 75. O roteiro foi escrito junto com a Grok, então o 75/75 mostra que as correções funcionam nos dublês. Não é homologação.

**Testes reais no CliNiv (7 cenários por versão):**
- Grok: 4 cenários OK, 2 parciais (cadastro e antropometria) e 1 falhou (prescrição no modo estruturado padrão). Na antropometria (rodada 5, com as chaves certas), todas as medidas entraram e só a data falhou.
- Original: 1 OK (exames), 3 parciais (cadastro, evolução e antropometria) e 1 falhou (prescrição estruturada). 2 cenários não foram testados na original (prescrição em Texto livre e EXTRAIR/COPIAR/LIMPAR).

Os três problemas mais graves no uso real:
1. **Prescrição no modo estruturado (padrão do CliNiv) não é preenchida por nenhuma das versões.** A original mostra "Editor nao encontrado." e a Grok não preenche nada. Só funciona com a aba **Texto livre** aberta antes.
2. **Datas nunca são preenchidas.** Os campos de data do CliNiv são `input[type=date]` e exigem `AAAA-MM-DD`, mas o JSON manda `DD/MM/AAAA`. Isso afeta o nascimento no cadastro, nas duas versões, e a data da antropometria: na original na rodada 2 e na Grok na rodada 5. Além disso, a Grok conta a data recusada como preenchida (F7).
3. **A original perde as quebras de linha da evolução.** As duas linhas ficaram fundidas numa só. Além disso, ela deixou listas abertas no cadastro (Etnia e Identidade de gênero) e não avisa o que deixou de preencher. A Grok corrige os três pontos.

## 2. Ambiente

- **Testes reais**
  - Google Chrome no desktop Linux do agente, em tela de cerca de 1280×800, sem emulação de celular. A versão exata do Chrome não foi registrada.
  - O script foi injetado colando o arquivo minificado (`carimbar.min.js` / `carimbar-grok.min.js`) no console do DevTools. Não foi pelo clique no favorito.
  - Site: app.cliniv.cloud, com o login do Dr. Thales, autorizado por ele para este teste.
- **Dados e páginas no CliNiv**
  - Usei só dados fictícios: o paciente da missão, Carlos Eduardo Mendes Barbosa.
  - Usei só o formulário **Novo paciente** e o paciente de teste **"teste lima" (Pront. 1726)**.
  - **Nada foi salvo, gerado, assinado ou finalizado.** Todos os formulários foram descartados (FECHAR, CANCELAR ou recarregar).
  - Conferência final: a timeline do paciente não tem nenhuma entrada com data de 09/11/2026.
- **Console:** os erros em vermelho foram todos do próprio CliNiv, não do script: "Error refreshing token", `ERR_TIMED_OUT` em api.cliniv.cloud e 401 no template de prescrição, quando a sessão expirou na rodada 3.
- **Testes unitários:** Linux, Node.js v24.22.1, jsdom 26.1.0. CKEditor, Angular Material e clipboard são dublês, e os toques são eventos sintéticos.
- **Não executado:** Firefox, Safari/WebKit, celular real ou emulado, clique real no favorito e `teste_carregamento.js` em navegador. Detalhes na seção 6 e em "O que não foi verificado".

## 3. Tabela de testes

### 3a. Testes reais no CliNiv — original × Grok

| Nº | Cenário | Original | Grok | Gravidade da falha |
|---|---|---|---|---|
| R1 | Cadastro (Novo paciente, JSON completo) | **Parcial.** Nascimento vazio. Etnia vazia com a lista aberta. Identidade de gênero vazia com a lista aberta. Nenhum aviso. Os demais campos OK e persistem. | **Parcial.** A barra mostrou "preenchidos: 15". Nascimento vazio, com aviso só no console. Etnia vazia, com aviso na barra "Opcao nao encontrada: etnia (Branca)". Identidade de gênero OK ("Homem Cisgênero"). Valores persistem e não há erro de validação. | Alta (Nascimento) / média (Etnia) |
| R2 | Evolução (texto de 2 linhas) | **Falhou parcialmente.** O texto entrou, mas as 2 linhas ficaram fundidas numa só. Sem mensagem de resultado. Persistiu. | **OK.** 2 parágrafos separados. Barra "Tipo: evolucao \| preenchidos: 1". Persistiu. | Média |
| R3 | Prescrição no modo estruturado (padrão) | **Falhou.** alert "Editor nao encontrado." e nada preenchido. A sessão do CliNiv expirou durante o teste (401). | **Falhou.** Um alert apareceu, mas o texto não foi capturado. A barra ficou "Texto salvo \| Nada extraido", nada foi preenchido e Controle Especial ficou desmarcado. | Alta |
| R4 | Prescrição com a aba Texto livre aberta antes, `especial:true` | Não testado | **OK.** Sem alert. Barra "preenchidos: 2 / ok". 2 parágrafos separados e Controle Especial marcado. | — |
| R5 | Pedido de exames | **OK** (rodada 2). Texto no editor e "CARIMBADO!". As quebras de linha não foram registradas. | **OK.** "Tipo: exames \| preenchidos: 1". 2 linhas separadas no Texto livre. | — |
| R6 | Antropometria | **OK com ressalva** (rodada 2, JSON da missão). 178, 96.4, 28.5, cintura 104 e observações preenchidos. A data 08/11/2026 gerou aviso de formato. | **Parcial.** Rodada 4, com chaves que o script não conhece: só altura e peso (F6). **Rodada 5, com as chaves certas: 8 de 9 OK** (altura 178, peso 96.4, cintura 100, abdômen 104, quadril 110, braço 35, coxa 58, obs). A **data 08/11/2026 ficou vazia** ("Informe a data da avaliação"), mas a barra contou "preenchidos: 9" (F2, F7). | Alta (data) / média (contador) |
| R7 | EXTRAIR / COPIAR / LIMPAR | Não testado no CliNiv | **OK.** EXTRAIR mostrou "1 pag. extraidas". COPIAR mostrou o alert "Copiado: 1 página(s).". LIMPAR pediu "Limpar tudo que foi extraido?" e a barra voltou a "Nada extraido". | — |

*Os JSONs de R6 não são iguais nas duas versões. A original recebeu o JSON da missão (rodada 2). A Grok recebeu, na rodada 4, `circunferencia_abdominal` e `observacoes`, e na rodada 5 as chaves do script (`data`, `altura`, `peso`, `cCintura`, `cAbdomen`, `cQuadril`, `cBraco`, `cCoxa`, `obs`).*

### 3b. Testes unitários (jsdom), em que a original falhou e a Grok passou

| Caso | Cenário | Linhas da original | Gravidade |
|---|---|---|---|
| 1 | Status inicial vazio | 2, 25–33, 52–54 | baixa |
| 3 | CANCELAR apaga o texto anterior (suspeito 1) | 331–333 | crítica |
| 11 | Campo inexistente sem aviso (suspeito 8) | 183, 325–327 | média |
| 16 | Zero em textarea é descartado | 187–191 | média |
| 20 | Quebras de linha no editor | 223 | alta |
| 22 / 22b / 22c | Dois editores: tocado, sem indicação, um oculto (suspeito 3) | 218–223 | crítica / crítica / alta |
| 31, 32, 61, 62 | mat-checkbox MDC | 236–242 | média |
| 34, 36, 63 | Lista com espaço extra ou acento | 194–202 | média |
| 39, 67 | Handlers da página sobrescritos e arraste por mouse (suspeito 2) | 85–96 | alta |
| 42, 43 | Regex do EXTRAIR (suspeito 6) | 347 | média |
| 47 | COPIAR anuncia sucesso falso (suspeito 5) | 375–381 | média |
| 60 | `especial:false` não desmarca | 284–287 | média |
| 64 | Sem resumo das chaves sem campo | 325–327 | média |
| 65 | description + special com JSON só de prescrição | 150–158 | alta |
| 66 | Rolagem interna da barra (suspeito 4) | 10, 98–101 | média |
| 68 | Campo textarea com setter de input (TypeError) | 174, 184 | média |
| 69 | `menorDeIdade:"false"` como texto | 241 | média |
| 71 | Versão identificável (só se aplica à Grok) | — | baixa |

Os outros 48 casos passaram nas duas versões: JSON inválido, Unicode, 20 mil caracteres, chaves ausentes, quota do EXTRAIR, LIMPAR, toques sintéticos, entre outros. O detalhe está em `resultados-original.json` e `resultados-grok.json`.

## 4. Detalhe de cada falha real (CliNiv)

### F1 — Prescrição no modo estruturado não é preenchida (as duas versões), alta

- **Passos:** paciente teste lima, abrir nova prescrição (o modo estruturado é o padrão), injetar o script, salvar o JSON `{prescricao, especial:true}` e tocar CARIMBAR.
- **Obtido:**
  - Original: alert "Editor nao encontrado.".
  - Grok: um alert cujo texto não foi capturado (erro da ferramenta de teste no diálogo). Nada foi preenchido.
- **Causa no código:** no modo estruturado não existe `.ck-editor__editable` na tela.
  - Original: `ck()` nas linhas 218–220 (`document.querySelector('.ck-editor__editable')` e `alert('Editor nao encontrado.')`), chamada pela prescrição nas linhas 280–287.
  - Grok: `ck()` nas linhas 379–381, chamada nas linhas 470–477. Pelo código, o alert mais provável na Grok é o mesmo "Editor nao encontrado." da linha 381, mas isso **não foi confirmado**.
- **Console:** só erros do CliNiv (401 no template de prescrição, sessão expirada na rodada da original).
- **Prints:** `prints/cliniv-prescricao-original.webp`, `prints/cliniv-prescricao-grok.webp`. Para comparação com o caso OK: `prints/cliniv-prescricao-livre-grok.webp`.
- **Correção sugerida:**
  - Antes de `ck()`, se a página tem `input[name="special"]` mas nenhum editor, procurar a aba cujo texto normalizado seja "TEXTO LIVRE". Clicar nela, aguardar até cerca de 2 s pelo `.ck-editor__editable` e então preencher.
  - Se a aba não for encontrada, trocar o alert por uma mensagem clara: "Abra a aba Texto livre da prescrição e toque CARIMBAR de novo."

### F2 — Data de nascimento não preenchida (as duas versões), alta

- **Passos:** abrir o formulário Novo paciente, colar o JSON da missão (`nasc: "22/07/1978"`) e tocar CARIMBAR.
- **Obtido:** o campo Nascimento ficou vazio. O Chrome recusou o valor, com aviso de formato no console. O campo é `input[type=date]`, cujo valor interno precisa ser `AAAA-MM-DD`.
- **Código:**
  - Original, linha 248: `t('bornDate', d.nasc)`. A função `t()` (linhas 180–186) grava a string crua.
  - Grok, linha 438, com `t()` nas linhas 321–327.
  - O mesmo vale para a data da antropometria: original linha 289 (`t('assessmentDate', d.data)`) e Grok linha 479. `08/11/2026` gerou aviso de formato na original (rodada 2) e na Grok (rodada 5). Na rodada 5, o Chrome avisou que "08/11/2026" não confere com o formato yyyy-MM-dd, e o CliNiv mostrou "Informe a data da avaliação".
- **Prints:** `prints/cliniv-data.webp`, `prints/cliniv-cadastro-original.webp`, `prints/cliniv-cadastro-grok.webp`, `prints/cliniv-antropometria-grok-chaves.webp`.
- **Correção sugerida:** dentro de `t()`, depois de achar o elemento, converter a data quando o campo for do tipo date:

  ```js
  if (e.type === 'date') {
    var m = String(v).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) v = m[3] + '-' + m[2] + '-' + m[1];
  }
  ```

  Depois disso, conferir se `e.value` ficou preenchido (ver F7). Se não ficou, registrar no resumo "Data invalida: nasc". A mesma conversão corrige a data da antropometria.

### F3 — Etnia "Branca" não casa com as opções do CliNiv (as duas versões), média

- **Obtido:** as opções do CliNiv são Não Informado, BRANCO, PRETO, PARDO, AMARELO e ÍNDIO. "Branca" difere no gênero da palavra.
  - Original: não selecionou e deixou a lista aberta.
  - Grok: não selecionou, fechou a lista e avisou na barra "Opcao nao encontrada: etnia (Branca)".
- **Código:**
  - Original: linha 257, com a comparação exata na linha 200.
  - Grok: linha 447, com `sel()` nas linhas 335–360. A Grok já ignora acento e espaço, mas não o gênero da palavra.
- **Print:** `prints/cliniv-etnia.webp`.
- **Correção sugerida:** antes de comparar, passar por um mapa de sinônimos normalizado: BRANCA→BRANCO, PRETA/NEGRA→PRETO, PARDA→PARDO, AMARELA→AMARELO, INDIGENA/INDIA→ÍNDIO, e "NAO INFORMADA"→"Não Informado". Outra opção: um terceiro passo que compara o radical, removendo o A/O final das duas strings normalizadas.

### F4 — Original deixa listas abertas e não informa o que faltou (cadastro), média

- **Obtido:** Etnia e Identidade de gênero ficaram vazias com a lista aberta, e nenhum aviso apareceu.
- **Hipótese sobre Identidade de gênero:** a comparação em maiúsculas da original deveria casar "Homem cisgênero" com "Homem Cisgênero". A hipótese provável é efeito cascata: a lista de Etnia ficou aberta e atrapalhou a lista seguinte. Isso **não foi confirmado**. Na Grok, que fecha a lista com Escape, o campo foi preenchido.
- **Código (original):**
  - Linha 201: `else { document.body.click(); }` não fecha o overlay do Angular Material.
  - Linhas 325–327: mostra "CARIMBADO!" sem contar o que faltou.
- **Correção sugerida (já aplicada na Grok):**
  - Enviar `keydown` Escape no mat-select e clicar no backdrop `.cdk-overlay-backdrop` (Grok, linha 356).
  - Mostrar o resumo de preenchidos e faltantes (Grok, linhas 515–520).

### F5 — Original funde as linhas da evolução, média

- **Obtido:** "Linha um da evolucao. Linha dois da evolucao." apareceu num único parágrafo. A Grok gerou 2 parágrafos.
- **Código (original):** linhas 319–322 chamam `ck(tv)`, e a linha 223 faz `editor.setData(texto)` com texto puro. O CKEditor 5 interpreta o texto como HTML e descarta o `\n`.
- **Prints:** `prints/cliniv-evolucao-original.webp`, `prints/cliniv-evolucao-grok.webp`.
- **Correção sugerida:** converter cada linha em `<p>` com escape de `& < >`, como `toEditorHtml` faz na Grok (linhas 259–264). Usar o mesmo para prescrição e exames.

### F6 — Antropometria na Grok: circunferência abdominal e observações vazias, sem aviso, média

- **JSON usado na rodada 4:** `{altura:178, peso:96.4, imc:28.5, circunferencia_abdominal:104, observacoes:'Teste ficticio'}`.
- **O que o código mostra:** a causa são os nomes das chaves usados no teste, não uma falha ao achar o campo. As duas versões leem:
  - `cAbdomen`, para o campo `cAbdomen` (circunferência abdominal): original linha 312, Grok linha 502;
  - `cCintura`, para `cWaist` (cintura): original linha 307, Grok linha 497;
  - `obs`, para `textarea[name="notes"]`: original linha 314, Grok linha 504.

  Nenhuma das versões conhece `circunferencia_abdominal`, `observacoes` ou `imc`. O IMC é calculado pelo próprio CliNiv, que mostrou 30,4.
- **Rodada 2 da original:** foi usado o JSON da missão, com `cCintura:"104"` e `obs`. Por isso a original preencheu "cintura 104" e observações. É o campo cintura (`cWaist`), não a circunferência abdominal (`cAbdomen`).
- **Conclusão:** com o mesmo JSON da rodada 4, a original também deixaria esses campos vazios.
- **Rodada 5, confirmação no CliNiv:** com as chaves do script, a Grok preencheu cintura 100, abdômen 104, quadril 110, braço 35, coxa 58 e obs, além de altura e peso. Só a data falhou (F2). O mapeamento está correto; o problema da rodada 4 eram mesmo as chaves.
- **Por que a Grok não avisou:**
  - O resumo só lista "Sem campo na pagina" quando a chave é conhecida e o campo não existe: `miss()` em `t()`, linhas 321–327; resumo nas linhas 515–520.
  - Chaves desconhecidas são ignoradas em silêncio. A lista de chaves conhecidas fica em `TIPO_KEYS`, linha 219, e `obs` nem consta nela.
- **Print:** `prints/cliniv-antropometria-grok.webp`, com a barra "Tipo: antropometria | preenchidos: 2". Para a original: `prints/cliniv-antropometria.webp`.
- **Correção sugerida:**
  1. Acrescentar ao resumo a linha "Chaves nao reconhecidas: …", calculada assim:

     ```js
     Object.keys(d).filter(function(k){ return TIPO_KEYS[tipo].indexOf(k) < 0 && k !== 'obs' && k !== 'texto'; })
     ```

     Pode ignorar as chaves de outros tipos, como a Grok já faz.
  2. Aceitar apelidos comuns: `circunferencia_abdominal`/`abdomen`→`cAbdomen`, `cintura`/`circunferencia_cintura`→`cCintura`, `quadril`→`cQuadril`, `observacoes`/`observacao`→`obs`.
  3. Correção do que eu disse antes sobre a linha 503 (`t('cThigh', d.cCoxa, 'cThigh')`): **não é um defeito de preenchimento.**
     - O 1º argumento (`'cThigh'`) é o `name` do campo no CliNiv, e o valor vem corretamente de `d.cCoxa`. A coxa foi preenchida (58) na rodada 5.
     - O 3º argumento é só o rótulo usado em `miss()` no aviso "Sem campo na pagina", e só aparece se o campo não existir na página.
     - Nas outras linhas esse rótulo é a chave do JSON (ex.: `'cCintura'`); aqui é `'cThigh'`. É só uma inconsistência de texto no aviso: trocar por `'cCoxa'` deixaria a mensagem coerente.

### F7 — Grok conta como preenchido um campo que o navegador recusou (contador falso positivo), média

- **Passos:** paciente teste lima, antropometria, JSON da rodada 5 com `data:'08/11/2026'` e mais 8 medidas, depois CARIMBAR.
- **Obtido:** a barra mostrou "Tipo: antropometria | preenchidos: 9 / ok" e o botão "CARIMBADO!". Só 8 campos entraram: a data ficou vazia e o resumo não avisou nada.
- **Código (Grok):** na função `t()`, linhas 321–327, a linha 326 faz `filled++` logo depois de `setVal(e, String(v)); fire(e);`, sem conferir se o valor ficou no campo. Um `input[type=date]` rejeita "08/11/2026" e fica com `value === ''`, mas mesmo assim conta como preenchido.
  - O mesmo padrão aparece em `ta()` (linhas 328–335), `nsel()` e `dt()`.
  - No cadastro, Nascimento provavelmente também entrou na contagem "preenchidos: 15". Isso é dedução pelo código, não foi conferido campo a campo.
- **Print:** `prints/cliniv-antropometria-grok-chaves.webp`.
- **Correção sugerida:**

  ```js
  var t = function(n, v, key){
    if(!has(v)) return;
    var e = document.querySelector('input[name="'+n+'"],textarea[name="'+n+'"],select[name="'+n+'"]');
    if(!e){ miss(key || n); return; }
    var s = String(v);
    if(e.type === 'date'){ var m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); if(m) s = m[3]+'-'+m[2]+'-'+m[1]; }
    setVal(e, s);
    fire(e);
    if(e.value === '' ) avisos.push(key + ': valor recusado pelo campo (' + v + ')');
    else filled++;
  };
  ```

  A conversão de data corrige também o Nascimento do cadastro (F2). A conferência de `e.value` impede o falso positivo em qualquer campo.

## 5. Pontos suspeitos 1 a 10

| Nº | Original | Grok | Evidência |
|---|---|---|---|
| 1. INSERIR/CANCELAR apaga o texto | Confirmado (jsdom, caso 3) | Corrigido | Linhas 331–333 |
| 2. Sobrescreve `onmousemove`/`onmouseup` | Confirmado (casos 39 e 67) | Corrigido com `addEventListener` | Linhas 94–96 |
| 3. Sempre o primeiro CKEditor | Confirmado com dublês (22, 22b, 22c) | Corrigido: contexto, visível, último tocado; pergunta se houver ambiguidade | Linhas 218–223. No CliNiv real, evolução e exames caíram no editor certo nas duas versões, e a prescrição em Texto livre caiu no editor certo na Grok. |
| 4. touch-action e rolagem da barra | Confirmado por inspeção do CSS (caso 66) | Corrigido | Linhas 10 e 98–101. **Sem teste em celular real.** |
| 5. COPIAR anuncia sucesso falso | Confirmado com APIs simuladas (caso 47) | Corrigido. No CliNiv real, "Copiado: 1 página(s)." apareceu. | Linhas 375–381. O conteúdo da área de transferência não foi lido. |
| 6. Regex do cdk-describedby | Confirmado (casos 42 e 43) | Corrigido com remoção via DOM | Linha 347 |
| 7. Detecção por ordem fixa | Confirmado (caso 65: JSON só de prescrição numa página com description gera "Chave evolucao nao encontrada.") | Corrigido (escolhe pelo JSON) | Linhas 150–158. No CliNiv, a Grok mostrou "página também parece: exames" em cadastro, evolução e prescrição, sem erro. |
| 8. Falhas silenciosas | **Confirmado no CliNiv real**: cadastro e evolução sem aviso | Parcialmente corrigido: avisa campo ausente e opção inexistente, mas **não avisa chave desconhecida** (F6) e **conta como preenchida uma data recusada** (F2, F7) | Linhas 180–186 e 325–327 |
| 9. Arraste preso | Não confirmado: os encerramentos sintéticos liberam o arraste (casos 51–55) | Igual | Sem toque físico, troca real de aba ou celular |
| 10. Lista sensível a acento/espaço | Confirmado (casos 34, 36 e 63) | Corrigido para acento e espaço. **Falta o gênero da palavra** (Branca × BRANCO, F3) | Linhas 194–202 |

## 6. Resultado do teste_carregamento.js por site

**Não foi executado em navegador.** A execução automatizada nos sites de terceiros foi bloqueada pela verificação de segurança do ambiente (injeção de código remoto em site de terceiros) e não foi refeita. A tabela abaixo é uma **previsão** feita a partir dos cabeçalhos Content-Security-Policy de cada site. Não é resultado observado.

| Site | 1. Script GitHub Pages | 2. Script jsDelivr | 3. Download GitHub Pages | 4. Download jsDelivr | 5. Executar código baixado |
|---|---|---|---|---|---|
| github.com | Bloqueado (previsão) | Bloqueado (previsão) | Bloqueado (previsão) | Bloqueado (previsão) | Bloqueado (previsão) |
| x.com | Bloqueado (previsão) | Bloqueado (previsão) | Provavelmente bloqueado | Provavelmente bloqueado | Bloqueado (previsão) |
| drthaleschateaubriand.github.io/quadro-livre-thales | Deve passar (sem CSP) | Deve passar | Deve passar | Deve passar | Deve passar |

Fato verificado: os dois `firebase-config.js` (GitHub Pages e jsDelivr) respondem HTTP 200. Para ter o resultado real, basta colar `teste_carregamento.js` no console de cada site e anotar os 5 itens da caixa.

## 7. Sugestões de melhoria (não são erros)

1. Clicar sozinho na aba "Texto livre" da prescrição, ou orientar o usuário com uma mensagem clara (F1).
2. Converter datas `DD/MM/AAAA` para `AAAA-MM-DD` em campos `type=date`: nascimento e data da avaliação (F2).
3. Usar um mapa de sinônimos e gênero da palavra nas listas: etnia, sexo, tipo sanguíneo (F3).
4. Listar no resumo as chaves do JSON não reconhecidas e aceitar apelidos como `circunferencia_abdominal` e `observacoes` (F6).
5. Publicar no `missao.md` ou num LEIA-ME a lista oficial de chaves por tipo de formulário, para quem gera o JSON.
6. Conferir `e.value` depois de gravar e só então contar como preenchido; listar os campos recusados no resumo (F7).
7. Manter um roteiro de regressão em navegador real (Chrome e Safari do iPhone) para os 7 cenários do CliNiv.

## O que não foi verificado (regra 6 da missão)

- O conteúdo do `localStorage`/`sessionStorage` depois de EXTRAIR e LIMPAR no CliNiv. Só a barra e os diálogos foram observados.
- O conteúdo real da área de transferência depois de COPIAR.
- O texto do alert da Grok na prescrição estruturada (rodada 3).
- A original na prescrição em Texto livre e em EXTRAIR/COPIAR/LIMPAR no CliNiv.
- A Grok na antropometria com os campos de gordura e dobras (`gordura`, `massaGorda`, dobras cutâneas). A rodada 5 cobriu só altura, peso, circunferências, obs e data.
- `teste_carregamento.js` em navegador real (só a previsão por CSP).
- O clique real no favorito (`javascript:`), celular, Firefox e Safari.
- A versão exata do Chrome usado.

## Arquivos

- **Pasta:** `/workspace/carimbar-teste/`
- **Fontes:** `carimbar.js` (original, intacta) e `carimbar-grok.js`, com a lista de mudanças em `carimbar-grok-mudancas.md`.
- **Testes jsdom:** `unit-tests-comparativo.cjs`, com os resultados em `resultados-original.json` e `resultados-grok.json`.
- **Resultados do CliNiv:** `cliniv-resultados.md`.
- **Prints:** `prints/cliniv-*.webp`:
  - cadastro-original, cadastro-grok
  - etnia, data
  - evolucao-original, evolucao-grok
  - prescricao-original, prescricao-grok, prescricao-livre-grok
  - exames-grok
  - antropometria, antropometria-grok, antropometria-grok-chaves
  - extrair-grok, copiar-grok, limpar-grok
