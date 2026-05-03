#!/usr/bin/env bash
set -euo pipefail

echo "[start] running database migrations..."
pnpm --filter @workspace/db run migrate

echo "[start] launching server..."
exec node --enable-source-maps dist/server/index.mjs
