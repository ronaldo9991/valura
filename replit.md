# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## AENS X VALURA (artifacts/valura-ui + artifacts/api-server)

Futuristic AI wealth platform. True black + metallic gold theme, light/dark toggle.

### Auth flow
- `/login` — Profile picker page lists demo users from Postgres via `useListUsers`.
- Selected userId persisted in `localStorage` under `valura.userId` (see `src/lib/auth.ts`).
- `/dashboard` is gated by `ProtectedDashboard` in `App.tsx` — redirects to `/login` if no stored user.
- "Switch profile" button in left sidebar clears storage and returns to `/login`.

### Dashboard features
- **Stock search** (top bar): debounced typeahead → opens drawer.
- **Stock detail drawer**: live AreaChart with range buttons (1D/5D/1M/3M/6M/1Y/5Y), key stats grid, "Ask AI" prompts that open the AI sidebar via `pendingPrompt` prop.
- **Beginner Mode toggle**: persisted in `valura.noviceMode`. Swaps technical labels for plain English everywhere; AI chat suggested chips also switch.
- **KPI cards**: 6-col grid with `min-w-0`, smaller responsive font, full-name tooltips to prevent truncation.
- **Top Holding live chart**: auto-derived from highest-weight position; nav item is conditional on `topHoldingTicker`.
- **Holdings table**: ticker now opens detail drawer.

### AI co-investor (AiChat)
- Imperative `send()` and `pendingPrompt` prop both guarded by `isStreaming` to prevent concurrent streams.
- External prompts (from drawer/dashboard) flow via `pendingPrompt` state → consumed in `useEffect` (no setTimeout race).

### New backend endpoints
- `GET /market/search?q=` → yahoo-finance2 `search()`, filtered to EQUITY/ETF.
- `GET /market/history/:symbol?range=1d|5d|1mo|3mo|6mo|1y|5y` → yahoo-finance2 `chart()`. Range validated at route layer (400 on invalid).
- OpenAPI ops: `searchSymbols`, `getMarketHistory`. Schemas: `SymbolSearchResult`, `ChartPoint`, `MarketHistory`.

### Demo users
- 10 demo users seeded directly in Postgres (no seed file): `user_001..user_010` — Marcus, Sarah, Hiroshi, Elena, David, Lina, Omar, Maya, Tomas, Yuki. Mix of risk profiles and sectors. Each has holdings + a unique cash_balances row.

### AI Agent Modes (5 personas)
- `ChatRequest.agentMode`: `"normal" | "coach" | "analyst" | "risk_officer" | "strategist"`. Picker UI lives just above the chat input in `ai-chat.tsx`.
- When `agentMode !== "normal"`, the pipeline **fully bypasses** the intent classifier (saves a model call) and routes straight to `handlePersonaChat()` in `ai-pipeline.ts`. Persona prompts also include user context + holdings.
- Persona label (e.g. "Risk Officer") is what shows in the assistant message badge.
- Hook signature: `sendMessage(userId, content, conversationId?, agentMode?)`.

### CHRONOS Mode (time-travel sandbox)
- New page `/chronos` (gated by `ProtectedChronos`). Date picker (with presets like "Pre-COVID", "ChatGPT launch"), `StockSearch`-driven position builder, sample portfolios ("All-in NVDA", "FAANG Classic", "Magnificent 7", "Just buy the index"), recharts AreaChart of portfolio vs SPY benchmark, per-position breakdown with trophy on the winner, plain-English `explanation` paragraph.
- Animated **Mode Switcher** (`components/mode-switcher.tsx`) sits in the dashboard top-right and on `/chronos` header — uses framer-motion `layoutId="mode-pill"` for the sliding gold pill animation.
- Backend: `POST /chronos/simulate` → `lib/chronos.ts`. Uses yahoo-finance2 `chart()` with `period1=startDate, interval="1d"` per symbol + SPY. Position values are forward-filled across the union of all dates so the timeline matches headline totals; **shares are summed when duplicate tickers are submitted**. Route hardens input by coercing `dollarAmount` to a finite positive number and rejecting otherwise (prevents string-concat bugs in totals).
- OpenAPI: `simulateChronos` op + `ChronosPosition`, `ChronosRequest`, `ChronosPositionResult`, `ChronosTimelinePoint`, `ChronosResult` schemas.

### Notes
- `lib/api-zod/src/index.ts` only re-exports `./generated/api` (Zod schemas). Re-exporting `./generated/types` causes name collisions with parameterized ops (e.g. `GetMarketHistoryParams`). **Orval `clean: true` regenerates this barrel on every codegen — must be re-applied after each `pnpm --filter @workspace/api-spec run codegen`.**
- SSE error events use `{ type: "error", error: "..." }` (not `message`); UI hook reads both for safety.
