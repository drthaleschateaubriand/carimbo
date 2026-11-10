#!/bin/bash
# grava o display :7 (desktop visível) enquanto o driver roda todos os cenários
OUT=/workspace/videos/carimbar-mv-nuvem-demo-correcoes.mp4
ffmpeg -y -loglevel error -f x11grab -framerate 8 -i :7 -vf "scale=1280:-2" -c:v libx264 -preset veryfast -pix_fmt yuv420p $OUT &
echo $! > /tmp/ffmpeg_nuvem.pid
sleep 2
/workspace/carimbar-mv-nuvem/testes/rodar_nuvem.sh :7 "$1" 1800 desktop > /workspace/carimbar-mv-nuvem/testes/run_demo.log 2>&1
sleep 2
kill -INT $(cat /tmp/ffmpeg_nuvem.pid); wait
echo GRAVADO
