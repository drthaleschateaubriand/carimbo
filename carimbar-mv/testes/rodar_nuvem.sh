#!/bin/bash
# uso: rodar_nuvem.sh <display> <cenarios> <pausa_ms> [desktop]
export DISPLAY=${1:-:99}
T=/workspace/carimbar-mv-nuvem/testes; cd $T
rm -f ext.log resultado.jsonl
if [ "$4" = "desktop" ]; then
  exec /workspace/wine-ahk/run.sh explorer /desktop=demo,1280x800 /workspace/wine-ahk/ahk/AutoHotkey64.exe /ErrorStdOut driver_nuvem.ahk "$2" "$3"
else
  exec /workspace/wine-ahk/run.sh /workspace/wine-ahk/ahk/AutoHotkey64.exe /ErrorStdOut driver_nuvem.ahk "$2" "$3"
fi
