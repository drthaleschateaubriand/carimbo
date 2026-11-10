# CARIMBAR MV nuvem 1.0: relatório dos testes

Rodado em 09/11/2026 (horário de Recife) no computador de testes do Grok Bot: AutoHotkey v2.0.31 de verdade sob Wine, falando por HTTPS (WinHttp) com a **nuvem real** (Supabase "carimbar"), contra uma janela de teste "TesteCarimbar - SoulMV" com vários campos de texto. A IA foi feita à mão: leitura com `carimbar.ultima_extracao()`, download das fotos com `carimbar_imagem` (curl) e resposta com `carimbar.responder_mv(...)`. Dados 100% fictícios ("Paciente Fictício de Teste").

Como repetir: `testes/rodar_nuvem.sh :99 evolucao,prescricao 600` (ou `gravar_demo_nuvem.sh` para gravar vídeo), responder cada extração que aparece em `testes/ext.log` e rodar `python3 conferir_nuvem.py resultado.jsonl`.

## Rodada 1 (12 cenários, vídeo carimbar-mv-nuvem-demo.mp4): 11 passaram, 1 falhou

| Cenário | Resultado |
|---|---|
| evolucao (Ctrl+Alt+M, Confirmar/substituir) | passou |
| prescricao (2 campos, Confirmar) | passou |
| exames (2 campos, Inserir no cursor) | passou |
| admissao (8 campos; uma chave ausente e uma vazia: os dois campos ficaram com o texto antigo e os outros ficaram alinhados) | passou |
| alta (botão CARIMBAR, 3 fotos, Confirmar) | passou |
| antropometria (8 campos) | passou |
| cancela_conf (Cancelar na confirmação: nada colado) | passou |
| ignora_outras (3 respostas erradas ignoradas, depois a correta colada) | passou (mas o contador mostrava 15 em vez de 3: o mesmo carimbo era contado a cada consulta) |
| janela_errada (outra janela na frente ao confirmar) | **FALHOU**: o programa devolvia o foco ao MV e colou |
| sem_paciente (resposta sem paciente: botões de colar desligados) | passou |
| cancela_espera (Cancelar na espera) | passou |
| limite_fotos (4 fotos no máximo; "Mais uma foto" desliga no limite) | passou |

Em todos, a área de transferência voltou ao valor de antes.

## Correções feitas por causa da rodada 1 (código, não teste)
1. O programa só devolve o foco ao MV se uma janela do próprio CARIMBAR ficou com o foco **e** a janela de onde o foco veio era o mesmo MV (rastreamento a cada 0,1 s). Antes valia qualquer janela do mesmo processo.
2. Cada resposta ignorada é contada uma vez só.

## Rodada 2 após as correções (4 cenários, vídeo carimbar-mv-nuvem-demo-correcoes.mp4): 4 de 4 passaram
evolucao, alta (3 fotos, botão CARIMBAR), ignora_outras (contador "Ignoradas 3") e janela_errada (nada colado, aviso "O MV não está na frente").

As outras telas não foram repetidas depois das correções; as correções só mexem no rastreamento do foco e na contagem.

## Fotos
A captura de tela (GDI+ para JPEG) funcionou sob Wine; as fotos baixadas pela nuvem mostram a janela de teste (alta: PARTE 1, 2 e 3, na ordem). Limites no servidor: 4 fotos, ~650 KB cada, 24 h.

## NÃO testado
Windows de verdade; SoulMV/Flash de verdade; foto real da tela do MV (inclusive se o Flash aparece na captura); se o Ctrl+V e o Tab chegam nos campos do Flash; o foco do MV ao clicar na janela de confirmação (janela "sem foco" WS_EX_NOACTIVATE) em Windows; antivírus e bloqueios da TI; ordem do Tab real das telas que não são a evolução (são EXEMPLOS); tempo de 15 minutos de espera (só o código).
