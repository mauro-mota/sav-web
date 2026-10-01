#!/usr/bin/env bash
# Publica o site: aplica o site.zip exportado do Claude Design por cima deste repositório, commita e dá push.
# Uso: duplo clique (usa o zip mais novo de ~/Downloads que contenha um index.html)
#      ou ./publicar.command caminho/do/site.zip ["mensagem do commit"]
set -euo pipefail
cd "$(dirname "$0")"
pick() {
  local z
  while IFS= read -r z; do
    if unzip -l "$z" 2>/dev/null | grep -qE '(^|/)index\.html$'; then printf '%s\n' "$z"; return 0; fi
  done < <(ls -t "$HOME"/Downloads/*.zip 2>/dev/null)
  return 0
}
ZIP="${1:-$(pick)}"
[ -n "$ZIP" ] && [ -f "$ZIP" ] || { echo "Nenhum zip com index.html em ~/Downloads. Uso: ./publicar.command caminho/do/site.zip"; exit 1; }
MSG="${2:-Atualiza site ($(date '+%d/%m/%Y %H:%M'))}"
echo "Zip: $ZIP"
git pull --ff-only --quiet 2>/dev/null || echo "Aviso: não consegui puxar a nuvem; seguindo com o que está local."
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
unzip -q -o "$ZIP" -d "$TMP"
SRC="$TMP"
if [ ! -f "$SRC/index.html" ]; then
  inner="$(find "$TMP" -mindepth 2 -maxdepth 3 -name index.html -not -path '*/__MACOSX/*' -print -quit)"
  [ -n "$inner" ] && SRC="$(dirname "$inner")"
fi
[ -f "$SRC/index.html" ] || { echo "O zip não tem index.html na raiz nem numa pasta logo abaixo."; exit 1; }
cp -R "$SRC"/. ./
rm -f .DS_Store; grep -qx '.DS_Store' .gitignore 2>/dev/null || echo '.DS_Store' >> .gitignore
git add -A
if git diff --cached --quiet; then echo "Nada mudou — nada para publicar."; rm -f "$ZIP"; exit 0; fi
echo; git --no-pager diff --cached --stat; echo
if [ -t 0 ]; then read -r -p "Publicar? [Enter = sim / Ctrl+C = não] "; fi
git commit -q -m "$MSG"
git push
rm -f "$ZIP"
echo "Enviado. O Cloudflare Pages publica em cerca de um minuto."
