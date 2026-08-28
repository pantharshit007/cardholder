# CardHolder

A personal web app to store visiting/business cards (name, phone, category, and image).

This repo is built **phase by phase** from `PLAN.md`. Phase 0 is the TanStack Start scaffold.

## Tooling

- **Package manager:** pnpm (do not use npm or yarn)
- **Lint / format:** ESLint + Prettier (official TanStack Start toolchain, not Biome)
- **Env:** t3-env (`src/env.ts`) — never read `process.env` / `import.meta.env` in app code

## Setup

```bash
pnpm install
cp .env.example .env
# Fill in required values in .env (see PLAN.md §4)
pnpm dev
```

Missing or invalid env vars fail fast when Vite starts.

## Scripts

```bash
pnpm dev          # local dev server (http://localhost:3000)
pnpm build
pnpm start        # preview production build
pnpm typecheck
pnpm lint
pnpm format
pnpm db:up        # wired in Phase 2
pnpm db:down
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```
