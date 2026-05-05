#!/usr/bin/env bash
set -euo pipefail

# Ensure production logging / deps behavior unless explicitly overridden (Railway often omits NODE_ENV at runtime).
export NODE_ENV="${NODE_ENV:-production}"

echo "[start] NODE_ENV=${NODE_ENV}"
echo "[start] running database migrations..."
pnpm --filter @workspace/db run migrate

echo "[start] launching server..."
exec node --enable-source-maps dist/server/index.mjs
