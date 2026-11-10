# CARIMBAR para Mac 1.0

Programa para o Macintosh com as mesmas funções do CARIMBAR para Windows 1.0: você aperta um atalho, tira de 1 a 4 fotos da janela que está na frente, a foto vai para a IA pela nuvem, você confere o paciente e o programa cola os textos campo a campo.

Ele nunca salva, nunca assina e nunca aperta Enter. Só usa colar, selecionar tudo (quando você pede para substituir) e Tab.

Este pacote **não foi executado em um Macintosh de verdade** na construção. A lógica, as chamadas à nuvem com dados fictícios e o empacotamento foram testados no Linux. Faça o primeiro uso com paciente de teste, sem salvar.

## 1. Instalar (uma vez)

1. Baixe o arquivo `.zip` (ou o `.dmg`, se houver) da sua arquitetura: `arm64` nos Macs com Apple Silicon (M1, M2, M3, M4) e `x64` nos Macs com processador Intel.
2. Abra o zip e arraste **CARIMBAR.app** para a pasta Aplicativos.
3. Na primeira vez o macOS pode recusar porque o programa **não é assinado pela Apple** (não passou por notarização). No Finder, clique no app com o **botão direito** e escolha **Abrir**. Confirme Abrir. Isso vale uma vez.
4. Quando o programa pedir, autorize em Ajustes do Sistema > Privacidade e Segurança:
   - **Gravação de Tela** (para fotografar a janela)
   - **Acessibilidade** (para colar e dar Tab)
5. Aparece um botãozinho **CARIMBAR** no canto de cima da tela. Pronto.

Para desligar: clique no ícone da bandeja (ou no botão com o botão direito) e escolha Sair.

## 2. Atalhos

| O que | Como |
|---|---|
| Começar (enviar a tela para a IA) | **Control + Option + M** (o mesmo Control+Alt+M do Windows) ou o botão CARIMBAR |
| Configurações | botão direito no botão CARIMBAR |
| Mais uma foto (tela longa) | botão **Mais uma foto** |
| Cancelar a espera | botão **Cancelar** |

## 3. Como usar

1. Abra a tela no sistema e deixe essa janela na frente. O título da janela precisa conter o trecho configurado (veja Configurações).
2. Aperte Control+Option+M (ou clique em CARIMBAR). Se a janela da frente não for a do sistema, o programa avisa e não envia nada.
3. Escolha qual tela é e clique em Continuar. Só a evolução está confirmada. As outras são EXEMPLOS: a ordem do Tab ainda precisa ser conferida no hospital, com paciente de teste, sem salvar.
4. O programa tira a primeira foto. Se a tela for longa, role até a parte que falta e clique em **Mais uma foto** (até 4). Depois clique em **Enviar para a IA**.
5. Diga à IA, no chat, o que preencher. O programa espera até 15 minutos e consulta a nuvem a cada 2 segundos.
6. Quando a IA responde, abre a confirmação com o **paciente** do JSON e a prévia de cada campo. Confira o nome com o cabeçalho da tela. O programa não lê o nome na foto: essa conferência é sua.
7. Clique no **primeiro campo** da tela e então em:
   - **Confirmar (substituir)**: seleciona tudo e cola por cima
   - **Inserir no cursor**: só cola, sem apagar
   - **Cancelar** (é o padrão): não cola nada
8. Não mexa no teclado nem no mouse até aparecer o aviso de campos colados. Confira e salve você mesmo.

## 4. Travas (iguais às do Windows)

- A resposta só vale se for **desta extração**. Respostas de outro número ou de outra tela são ignoradas.
- Sem o nome do paciente no JSON, os botões de colar ficam desligados.
- O título da janela é conferido antes da foto, ao confirmar e antes de cada campo. Se outra janela estiver na frente, a colagem para e avisa quantos campos já foram.
- A área de transferência é devolvida no fim (no Mac, o conteúdo em texto; imagens ou formatos especiais podem não voltar por completo).

## 5. Configurações úteis

- **Trecho do título da janela:** o programa só fotografa e cola se o título da janela da frente contiver esse texto.
- **Atalho de colar:** nos programas nativos do Mac use Cmd+V / Cmd+A. Se o sistema roda numa área remota Windows, troque para Ctrl+V / Ctrl+A.
- Se o texto colado vier antigo, aumente o atraso depois de colar (por exemplo, 1000 ms). Se as linhas saírem dobradas, troque as quebras para só LF.

## 6. Privacidade

A foto da janela vai para a nuvem do CARIMBAR e pode mostrar o cabeçalho do paciente. Fica guardada no máximo 24 horas e é apagada sozinha. Só quem tem o código secreto desta sessão (neste computador) consegue baixar. Não envie telas com dados que não devem sair. Use primeiro um paciente de teste.

## 7. O que não se reproduziu por completo, em relação ao Windows

- No Windows o programa usa uma janela que **não toma o foco** ao clicar em Confirmar. No Mac isso não existe do mesmo jeito: a janela de confirmação pode tomar o foco, e o programa tenta devolver o foco ao sistema antes de colar. Clique no primeiro campo logo antes de confirmar.
- A restauração da área de transferência no Mac cobre texto, não necessariamente imagens.
- A foto usa `screencapture` (e o identificador da janela, quando dá). Não há como afirmar daqui que uma tela antiga (por exemplo em Flash, ou dentro de outro programa) aparece inteira na captura. Isso só se confirma no Macintosh, no sistema real.
- Este programa não roda o AutoHotkey; é um app Electron à parte, feito para o Mac.

## 8. Compilar (desenvolvedores)

No Macintosh:

```
cd carimbar-mac
./scripts/build.sh
```

No Linux, o mesmo script gera os `.zip` com o `.app` (sem DMG). O fluxo para o GitHub Actions (runner `macos-latest`, que gera também o DMG) está em `carimbar-mac/github-workflows/carimbar-mac.yml`. Para ativá-lo, copie esse arquivo para `.github/workflows/` no repositório (isso pede a permissão `workflow` no GitHub). Não há assinatura nem notarização da Apple.
