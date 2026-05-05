#!/usr/bin/env bash
set -euo pipefail

# Ensure production logging / deps behavior unless explicitly overridden (Railway often omits NODE_ENV at runtime).
export NODE_ENV="${NODE_ENV:-production}"

echo "[start] NODE_ENV=${NODE_ENV}"
echo "[start] launching server (migrations run inside Node after listen)..."
exec node --enable-source-maps dist/server/index.mjs
