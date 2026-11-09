# carimbo

CARIMBAR, versão **Grok v2**: um bookmarklet que preenche os formulários do CliNiv a partir de um JSON.

## Arquivos
- `carimbar-grok.js`: código-fonte legível.
- `carimbar-grok.min.js`: versão minificada.
- `carimbar-grok-favorito.txt`: link `javascript:` para colar como favorito.
- `carimbar-grok-instalar.html`: página de instalação (abra e arraste o botão para a barra de favoritos).
- `carimbar-grok-mudancas.md`: o que mudou em relação à versão original.
- `relatorio-final.md`: relatório dos testes (simulados e no CliNiv real).
- `testes/`: testes automatizados (jsdom).

## Testes da v2
- 75 de 75 nos testes comparativos e 24 de 24 nos testes novos da v2.
- No CliNiv real (09/11/2026), passou em cadastro, prescrição (troca automática para a aba Texto livre), antropometria e evolução, sem salvar nada.
