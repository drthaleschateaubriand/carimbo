# CARIMBAR Grok (v2.1)

Favorito (bookmarklet) que **preenche formulários de qualquer sistema web a partir de um JSON colado** e **extrai o conteúdo de qualquer página**. Não instala nada e não carrega nada de fora: todo o código vai dentro do próprio favorito.

## O que faz

- **CARIMBAR:** detecta o tipo de formulário da página (cadastro, prescrição, antropometria, exames ou evolução) e preenche os campos com os valores do JSON salvo.
  - Usa os setters nativos e dispara input, change e blur, para que frameworks como Angular e React reconheçam os valores.
  - Converte datas `DD/MM/AAAA` para `AAAA-MM-DD` nos campos `type=date`.
  - Escolhe as opções das listas sem depender de acento, espaço ou gênero da palavra (Branca → BRANCO).
  - Na prescrição, abre sozinho a aba "Texto livre" quando ela existe.
- **INSERIR TEXTO:** cola e guarda o JSON (sessionStorage `carimbarJSON`). CANCELAR não apaga o texto anterior.
- **Resumo na barra:** mostra quantos campos foram preenchidos, as chaves sem campo na página, as opções não encontradas e os valores que o campo recusou. Não usa alert.
- **AVANCADO → EXTRAIR / COPIAR / LIMPAR:** guarda o HTML da página atual (localStorage `__thales_extractor__`), copia tudo para a área de transferência (avisa se a cópia falhar) e limpa o que foi extraído.

## Instalação

Abra `carimbar-teste/index.html` (ou `carimbar-grok-instalar.html`) no navegador:
- **Chrome, Edge ou CentBrowser:** arraste o botão "🔖 CARIMBAR Grok" para a barra de favoritos.
- **Safari (Mac):** siga os passos da aba Safari.
- **iPhone/iPad:** use o botão "Copiar código do bookmarklet" e cole o código no endereço de um favorito.

## Arquivos (pasta `carimbar-teste/`)

| Arquivo | Conteúdo |
|---|---|
| `carimbar-grok.js` | Código-fonte da versão Grok (v2.1), legível e comentado |
| `carimbar-grok.min.js` | Versão minificada |
| `carimbar-grok-favorito.txt` | O favorito pronto (`javascript:...`) |
| `carimbar-grok-instalar.html`, `index.html` | Página de instalação (mesmo conteúdo) |
| `build-grok.cjs` | Gera o min, o favorito e as páginas de instalação a partir do fonte (`node build-grok.cjs`) |
| `carimbar-grok-mudancas.md` | Lista de mudanças em relação ao original (v1, v2 e v2.1) |
| `unit-tests-comparativo.cjs` | 75 testes comparativos (original × Grok) em jsdom |
| `unit-tests-grok-v2.cjs` | 30 testes das correções v2 e v2.1 |
| `carimbar-grok-v1.*`, `carimbar-grok-*-v1.*` | Cópias de segurança da v1 |
| `carimbar.js` | Versão original, preservada sem alterações |

## Testes

A ferramenta foi testada em sistema real e em testes automatizados.
- **Sistema real:** dados fictícios, nada salvo. Cobriu cadastro, evolução, prescrição, exames, antropometria e EXTRAIR/COPIAR/LIMPAR, e as falhas encontradas lá foram corrigidas na v2. A v2 também foi testada no sistema real em 09/11/2026: datas, etnia, troca automática para a aba Texto livre e contador funcionaram.
- **Automatizados (jsdom):** Grok v2.1 com 75/75 no roteiro comparativo e 30/30 no roteiro das correções. A versão minificada do favorito tem o mesmo resultado. O original fica em 48/75.

Para rodar os testes:

```
cd carimbar-teste
CARIMBAR_FILE=carimbar-grok.js LABEL=grok node unit-tests-comparativo.cjs
node unit-tests-grok-v2.cjs
```

## Observações

- Se a barra da versão original estiver aberta na página, a Grok não abre: feche a outra com o X antes.
- O texto colado numa versão anterior é migrado automaticamente para a chave nova ao abrir a Grok.
- Fase de teste: o código está em texto puro. Não distribua sem revisão.
