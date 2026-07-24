#!/bin/sh
# ce app entry: the supervisor's PATH may lack node (nvm/homebrew installs). Find one, exec
# the committed self-contained bundle. Loud failure beats a silent respawn loop.
DIR="$(cd "$(dirname "$0")" && pwd)"
LOG="$DIR/daemon.log"
exec >> "$LOG" 2>&1
echo "[run.sh] $(date) starting (PATH=$PATH)"
if command -v node >/dev/null 2>&1; then exec node "$DIR/app.mjs"; fi
for cand in "$HOME"/.nvm/versions/node/*/bin/node /opt/homebrew/bin/node /usr/local/bin/node; do
  [ -x "$cand" ] && exec "$cand" "$DIR/app.mjs"
done
echo "loppis: no node runtime found (PATH, nvm, homebrew, /usr/local)" >&2
exit 127
