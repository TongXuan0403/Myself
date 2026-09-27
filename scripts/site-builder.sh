#!/bin/sh
set -eu
last=""
while :; do
  current="$(find "${MYSELF_CONTENT_DIR:-/app/apps/site/src/content/published}" -type f -print0 2>/dev/null | sort -z | xargs -0 sha256sum 2>/dev/null | sha256sum || true)"
  if [ "$current" != "$last" ]; then
    echo "Building public site from published content..."
    npm --workspace apps/site run build
    last="$current"
  fi
  sleep 10
done
