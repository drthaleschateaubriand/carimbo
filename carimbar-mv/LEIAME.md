# CARIMBAR MV nuvem 1.0 (para o SoulMV)

O CARIMBAR MV nuvem faz no MV o mesmo caminho do CARIMBAR 1.3/1.4: você aperta um botão, a tela vai para a IA pela nuvem, você diz à IA o que preencher, a IA responde, e você aperta **Confirmar** para o programa colar tudo nos campos.

Como a tela do MV é em Flash, nenhum programa consegue ler os campos de dentro dela. Por isso o programa manda **fotos da janela do MV** (de 1 a 4) em vez da lista de campos.

**Ele nunca salva nada no MV, nunca aperta Enter e nunca assina.** Só usa Ctrl+V, Ctrl+A (no "substituir") e Tab. Você confere e salva.

## 1. Instalar (uma vez)

1. Instale o AutoHotkey versão 2: https://www.autohotkey.com/download/ahk-v2.exe
   Se o computador pedir senha de administrador ou bloquear, é a TI que precisa liberar.
2. Baixe o arquivo `carimbar-mv-nuvem.ahk` e dê **dois cliques** nele.
3. Aparece um ícone verde com um H perto do relógio e um botãozinho **CARIMBAR** no canto de cima da tela. Pronto, está ligado.

Para desligar: botão direito no ícone verde > Exit (ou feche o botãozinho CARIMBAR).

## 2. Atalhos

| O que | Como |
|---|---|
| Começar (enviar a tela para a IA) | **Ctrl + Alt + M** ou clique no botãozinho **CARIMBAR** |
| Tirar mais uma foto (tela longa) | botão **Mais uma foto** na janela "fotos" |
| Cancelar a espera | botão **Cancelar** na janela "aguardando a IA" |

## 3. Como usar, passo a passo

1. Abra a tela no MV (por exemplo a evolução) e **deixe o MV na frente**.
2. Aperte **Ctrl+Alt+M** (ou clique em CARIMBAR). Se o MV não estiver na frente, o programa avisa e não envia nada.
3. Escolha **qual tela** é e clique em Continuar. As telas são: evolucao, prescricao, exames, admissao, alta, antropometria. **Só a evolução está confirmada.** As outras são EXEMPLOS (veja a parte 5).
4. O programa tira a primeira foto da janela do MV. Aparece a janela **fotos**:
   - A tela cabe inteira? Clique em **Enviar para a IA**.
   - A tela é longa? **Role o MV** até a parte que falta e clique em **Mais uma foto**. Pode repetir até 4 fotos. Depois clique em **Enviar para a IA**.
   - Se a foto tiver o cabeçalho com o nome do paciente, a IA consegue conferir.
5. Aparece **"Enviado. Aguardando a IA..."** com o código da sessão, o número da extração e a hora do envio. Agora diga à IA, no chat, o que preencher (texto ou áudio). Se quiser desistir, clique em Cancelar. O programa espera até 15 minutos e consulta a nuvem a cada 2 segundos.
6. Quando a IA responde, abre a janela **confirmar**. Ela mostra:
   - o **paciente** (e o prontuário) que veio no JSON, a hora em que você enviou e o número da extração;
   - uma **prévia de cada campo** que vai ser colado, na ordem do Tab. Campo vazio mostra "só o Tab, nada é colado".
7. **Confira o nome do paciente com o cabeçalho do MV.** O programa não lê o nome na tela: essa conferência é sua.
8. **No MV, clique dentro do PRIMEIRO campo da tela.** A janela de confirmação não rouba o foco do MV, então o cursor continua lá. Depois clique em um destes botões:
   - **Confirmar (substituir)**: em cada campo, seleciona tudo (Ctrl+A) e cola por cima do que estava.
   - **Inserir no cursor**: só cola, sem apagar nada, onde o cursor está.
   - **Cancelar** (é o padrão): não cola nada.
9. O programa cola o campo 1, aperta Tab, cola o campo 2, e assim por diante. **Não mexa no teclado nem no mouse** até aparecer o aviso "campo(s) colado(s)".
10. **Confira os campos no MV e salve você mesmo.**

### Por que é seguro
- A resposta só vale se for **desta extração**: a nuvem grava o número da extração junto da resposta, e o programa ignora qualquer resposta com outro número, ou de outra tela. Respostas ignoradas aparecem contadas na janela de espera.
- Se a resposta vier **sem o nome do paciente**, os botões de colar ficam desligados.
- O título da janela é conferido **antes de tirar a foto**, **ao apertar Confirmar** e **antes de cada campo**. Se o MV deixar de estar na frente, a colagem para na hora e avisa quantos campos já foram.
- Se outra janela (e-mail, navegador, etc.) estiver na frente quando você apertar Confirmar, **nada é colado**.
- JSON inválido ou valor vazio: **nada é colado** naquele campo (o Tab continua sendo dado, para os outros campos não saírem do lugar).
- A área de transferência (o que você tinha copiado) é **sempre devolvida** no fim.

## 4. Privacidade

A foto da janela do MV vai para a nuvem do CARIMBAR (Supabase) e pode mostrar o **cabeçalho do paciente**. Ela fica guardada **no máximo 24 horas** e é apagada sozinha; só quem tem o código secreto da sessão (guardado neste computador) consegue baixar. Se a tela tiver dados que não devem sair, não envie. Use primeiro um paciente de teste.

## 5. Telas e a ordem do Tab (como ajustar uma tela nova)

No começo do arquivo `.ahk`, a parte "telas" tem uma linha por tela:

```
AddTela("evolucao", "Evolução", ["evolucao"], false)
AddTela("prescricao", "Prescrição", ["prescricao", "orientacoes"], true)
```

Cada linha tem: o nome interno, o título que aparece, **a lista dos campos na ordem do Tab** e `true` se ainda é EXEMPLO (não conferido) ou `false` se já foi conferido no hospital.

Telas que já vêm como **EXEMPLO (a ordem do Tab ainda não foi conferida no hospital)**:

| Tela | Chaves em ordem (exemplo) |
|---|---|
| evolucao (confirmada: um campo só) | evolucao |
| prescricao | prescricao, orientacoes |
| exames | exames, indicacao |
| admissao (anamnese) | queixa, hda, antecedentes, medicamentos, alergias, exameFisico, hipotese, conduta |
| alta (sumário) | diagnostico, resumo, condicaoAlta, orientacoes, retorno |
| antropometria | data, altura, peso, gordura, cCintura, cQuadril, cBraco, cPescoco |

**Como descobrir a ordem do Tab de uma tela (com paciente de teste, sem salvar):**
1. Abra a tela no MV e clique no **primeiro campo**.
2. Aperte **Tab** e anote o nome de cada campo em que o cursor cair, de cima para baixo, até o último. Se o Tab passar por algo que não é campo de texto (botão, caixa de marcar, lista), anote como **vazio**: `""`.
3. Escreva a lista na linha da tela, com um nome curto para cada campo (sem espaço, sem acento). Um campo que não deve ser preenchido leva `""` (o programa só dá o Tab). **O número de itens da lista tem de bater com o número de Tabs até o último campo.**
4. Teste com paciente de teste: clique no primeiro campo e use **Inserir no cursor**. Confira se cada texto foi para o campo certo. Só então troque `true` por `false`.

Os nomes das chaves seguem os do CARIMBAR 1.3/1.4 (evolucao, prescricao, exames, altura, peso, cCintura...). A IA recebe a lista da tela escolhida e responde com essas chaves.

Campos que são caixas de marcar ou listas (por exemplo "especial" na receita) o programa não preenche: ele só cola texto.

## 6. Configurações no começo do arquivo

- `JANELA := "SoulMV"`: o título da janela do MV tem de **conter** essa palavra. Se o programa disser que a janela não é a do MV, ele mostra o título real; me mande, ou troque a palavra.
- `ATRASO_COLAR := 400`: se o MV colar texto antigo, aumente para 1000.
- `USAR_CRLF := true`: se as linhas saírem dobradas, troque para `false`.
- `FOTO_LARGURA := 1280` e `FOTO_QUALIDADE := 60`: tamanho e qualidade de cada foto.
- `MAX_FOTOS := 4`.

## 7. Se der problema

| Sintoma | O que fazer |
|---|---|
| "A janela ativa não é a do SoulMV" | Clique no MV antes e tente de novo; confira o título mostrado. |
| "Não consegui tirar a foto" | Veja se a janela do MV não está minimizada. Tente de novo. |
| Fica em "Aguardando a IA" | Peça à IA para responder para a **extração com o número que aparece na janela**. |
| "Ignoradas N respostas" | A IA respondeu sem o número da extração ou para outra. Peça de novo com o número certo. |
| Colou texto antigo | Aumente `ATRASO_COLAR`. |
| Linhas dobradas | `USAR_CRLF := false`. |
| Tab caiu no campo errado | A ordem da tela está errada: refaça a parte 5. |

## 8. O que não foi testado de verdade

O programa foi testado rodando o AutoHotkey de verdade (sob Wine, no computador de testes), com a nuvem real e uma janela de teste chamada "TesteCarimbar - SoulMV" com vários campos. **Não foi testado:** Windows de verdade, o SoulMV/Flash de verdade, a foto da tela real do MV (nem se o Flash aparece na captura), se o Ctrl+V e o Tab chegam nos campos do Flash, o foco ao clicar na janela de confirmação, antivírus e bloqueios da TI. Faça o primeiro teste com **paciente de teste, sem salvar**.
