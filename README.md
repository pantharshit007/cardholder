# CardHolder

A personal web app to store visiting/business cards (name, phone, category, and image).

This repo is built **phase by phase** from `PLAN.md`. Phase 2 adds Docker Postgres + Drizzle ORM.

## Tooling

- **Package manager:** pnpm (do not use npm or yarn)
- **Lint / format:** ESLint + Prettier (official TanStack Start toolchain, not Biome)
- **Env:** t3-env (`src/env.ts`) — never read `process.env` / `import.meta.env` in app code
- **Database:** Docker Postgres in development; Neon (HTTP driver) in production. Schema via Drizzle.

## Setup

```bash
pnpm install
cp .env.example .env
# Fill in required values in .env (see PLAN.md §4)
pnpm db:up          # start local Postgres
pnpm db:migrate     # apply migrations
pnpm dev
```

Missing or invalid env vars fail fast when Vite starts.

## Database

Dev uses Docker Compose (`postgres:16`) with:

- db / user / password: `cardholder`
- port: `5432`
- `DATABASE_URL=postgres://cardholder:cardholder@localhost:5432/cardholder`

The shared Drizzle client in `src/db/index.ts` selects:

- **`pg`** (node-postgres) when `NODE_ENV` is not `production` (or `DB_DRIVER=pg`)
- **Neon HTTP** when `NODE_ENV=production` (or `DB_DRIVER=neon`)

```bash
pnpm db:up        # docker compose up -d
pnpm db:down      # docker compose down
pnpm db:generate  # drizzle-kit generate (after schema changes)
pnpm db:migrate   # apply migrations in ./drizzle
pnpm db:studio    # Drizzle Studio
pnpm db:smoke     # select 1 + table counts
```

## Scripts

```bash
pnpm dev          # local dev server (http://localhost:3000)
pnpm build
pnpm start        # preview production build
pnpm typecheck
pnpm lint
pnpm format
```
