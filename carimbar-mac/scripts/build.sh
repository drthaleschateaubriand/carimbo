#!/usr/bin/env bash
# Gera o pacote do CARIMBAR para Mac.
# No Linux: zip .app por arquitetura (electron-builder; sem assinatura Apple).
# DMG em geral só sai direito em um runner macOS (veja .github/workflows/carimbar-mac.yml).
set -euo pipefail
cd "$(dirname "$0")/.."
if ! command -v npm >/dev/null; then
  echo "precisa do Node/npm" >&2
  exit 1
fi
npm install
npm test
export CSC_IDENTITY_AUTO_DISCOVERY=false
if [[ "$(uname -s)" == "Darwin" ]]; then
  npx electron-builder --mac dmg zip --arm64 --x64
else
  echo "Rodando em $(uname -s): vou gerar zip (não DMG). O DMG fica a cargo do workflow macos-latest."
  npx electron-builder --mac zip --arm64 --x64
fi
echo "Prontos em dist/:"
ls -lh dist/*.{zip,dmg,yml} 2>/dev/null || ls -lh dist/
