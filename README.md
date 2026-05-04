# Valura Finance Hub

AI-driven wealth management platform built as a pnpm-workspace monorepo.

- **Frontend**: React 19 + Vite + TypeScript, Tailwind CSS v4, Radix/shadcn UI, TanStack Query, Recharts, Wouter
- **Backend**: Express 5 + Node 24 + TypeScript, esbuild bundle, Pino structured logging
- **Database**: PostgreSQL 16 + Drizzle ORM with Drizzle-Zod schemas
- **AI**: OpenAI GPT-4o for multi-agent personas (Co-Investor, Coach, Analyst, Risk Officer, Strategist)
- **Market data**: yahoo-finance2 (quotes, history, search, movers)
- **Differentiated features**: Chronos time-travel portfolio simulation, intent-classified AI pipeline

## Workspace layout

```
artifacts/
  api-server/     # Express API (entry: src/index.ts -> dist/index.mjs)
  valura-ui/      # Vite SPA (build output: dist/public/)
  mockup-sandbox/ # Component sandbox (not deployed)
lib/
  db/             # Drizzle schema + migrations
  api-spec/       # OpenAPI source spec
  api-zod/        # Generated Zod schemas
  api-client-react/ # Generated React Query hooks
scripts/
  bundle.mjs      # Stitches api-server + valura-ui builds into top-level dist/
  start.sh        # Migrations + boot (used by Railway)
```

## Local development

```bash
pnpm install
# Run api-server (port 8080) and UI (port 5173) in separate terminals:
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/valura-ui run dev
```

The Vite dev server proxies `/api/*` to `http://localhost:8080`, so both servers run on their own ports without CORS surgery.

## Production build

```bash
pnpm run build       # typecheck -> ui build -> api build -> bundle
pnpm run start       # node dist/server/index.mjs
```

The build produces a single `dist/` tree:
- `dist/server/index.mjs` — bundled Express server
- `dist/public/` — Vite SPA

In production (`NODE_ENV=production`), Express serves `dist/public/` as static assets and falls back to `index.html` for any non-`/api` route.

## Database migrations

Schema is defined in `lib/db/src/schema/`. Generate SQL after schema changes:

```bash
pnpm --filter @workspace/db run generate   # writes lib/db/drizzle/*.sql
pnpm --filter @workspace/db run migrate    # applies pending migrations
```

`scripts/start.sh` runs migrations before booting the server, so deploys are idempotent.

## Environment variables

See [.env.example](./.env.example) for the full list. Required for production:

| Var | Source |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | injected by Railway |
| `DATABASE_URL` | Railway Postgres add-on |
| `OPENAI_API_KEY` | OpenAI dashboard |
| `PUBLIC_URL` | your Railway domain (used for CORS allowlist) |

Optional / once those phases ship:

| Var | Notes |
| --- | --- |
| `CLERK_*`, `VITE_CLERK_PUBLISHABLE_KEY` | Clerk auth |
| `FINNHUB_API_KEY` | News feed |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Price alerts |
| `SENTRY_DSN`, `VITE_SENTRY_DSN` | Error tracking |

> Vite env vars (`VITE_*`) are baked into the bundle at build time. Set them as Railway env vars before the first build, or redeploy after adding them.

## Railway deployment

This repo ships with [`railway.json`](./railway.json) configured for Nixpacks. To deploy:

1. **Provision Postgres** in your Railway project (Add → Database → PostgreSQL). Reference its `DATABASE_URL` on the app service via `${{Postgres.DATABASE_URL}}`.
2. **Set env vars** (see table above) on the app service. Do NOT set `PORT` — Railway injects it.
3. **Connect this GitHub repo** (`ronaldo9991/valura`) and Railway will:
   - run `pnpm install --frozen-lockfile && pnpm run build`
   - run `./scripts/start.sh` which applies migrations then boots `node dist/server/index.mjs`
   - probe `/api/healthz` for liveness
4. **Custom domain (optional)** — Settings → Domains, add CNAME, Let's Encrypt cert auto-issues. Update `PUBLIC_URL` after switch.

Health endpoints:
- `GET /api/healthz` — cheap liveness (used by Railway)
- `GET /api/readyz` — DB connectivity probe (returns 503 if Postgres is unreachable)

## Continuous integration

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs typecheck + build on every PR and push to `main`. Recommend enabling branch protection on `main` requiring this check.

## Roadmap

Tracked in `/Users/rivalin/.claude/plans/rate-the-platform-and-imperative-ullman.md` (planning artifact). Shipped in this commit:

- ✅ Phase A: Replit removal + single deployable artifact
- ✅ Phase B.2/B.3: Helmet, CORS allowlist, rate limiting, graceful shutdown, `/readyz`, error boundary
- ✅ Phase B.5: Drizzle generate+migrate workflow
- ✅ Phase D: Railway config
- ✅ Phase E: GitHub remote + CI

Pending follow-ups:
- Phase B.1: Clerk auth (replaces localStorage demo) + `/me/*` route refactor
- Phase B.4: Sentry wiring (requires DSN)
- Phase C.1: Watchlists feature
- Phase C.2: News feed (Finnhub)
- Phase C.3: Price alerts (Resend + cron worker)
