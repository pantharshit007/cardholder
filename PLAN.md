# CardHolder — Implementation Plan

A personal web app to digitally store visiting/business cards: **name, phone, category, and an image**. Manual entry is the primary flow; OCR (auto-extract from the card photo) is a supported convenience. Images are hosted on **Cloudinary**; card metadata lives in **Postgres**.

This document is the single source of truth for the build. It is written so an implementing agent can execute it **phase by phase**, stopping at each review checkpoint. Do not skip phases. Do not merge future-phase work early.

---

## 1. Confirmed Decisions

| Area | Decision |
| --- | --- |
| Framework | **TanStack Start** (React, Vite, file-based routing, server functions) |
| Language | **TypeScript** (strict) |
| Package manager | **pnpm** (all commands use `pnpm` / `pnpm dlx`) |
| Env management | **t3-env** (`@t3-oss/env-core` + Zod) — typed, validated env in `src/env.ts`; no raw `process.env`/`import.meta.env` in app code |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite` plugin) |
| UI components | **shadcn/ui** |
| Database | **Postgres** — **Docker Postgres in dev**, **Neon** (serverless HTTP) in production |
| ORM | **Drizzle ORM** + `drizzle-kit` migrations |
| Auth | **Better Auth** — email + password, sessions in Postgres (single user now, multi-user ready) |
| Image storage | **Cloudinary**, **unsigned direct-to-Cloudinary** browser upload via upload preset |
| OCR | **Deferred / post-MVP (optional).** The MVP uses the **manual form only** to enter card info. OCR is not relied upon for the core product. When later enabled: **OCR.space free public endpoint**, called **server-side**, using the shared demo key `helloworld` (no signup); env var `OCR_SPACE_API_KEY` defaults to `helloworld` so a real key can be swapped in without code changes. OCR would only ever *pre-fill* the form — never required |
| Categories | **Managed category table** (create/edit/delete; cards reference a category) |
| Deployment | Portable: buildable for **Cloudflare** or **Vercel**; decision deferred to Phase 8 |

### Non-negotiable principles
- **Single user with login now, but multi-user-ready.** Every `cards` and `categories` row carries a `userId`. Every query is scoped by the authenticated user. Never return another user's data.
- **Secrets never reach the client.** OCR.space API key and Cloudinary API secret live only in server env. Only the Cloudinary *cloud name* and *unsigned upload preset* are public.
- **Validation on the server.** Client validation is UX; the server function re-validates every input with Zod.
- **Portability.** No provider-specific lock-in beyond documented env vars. Neon HTTP driver works on both Cloudflare and Vercel. Dev uses Docker Postgres via the same `DATABASE_URL` contract.
- **Code organization (enforced).** Keep files small and single-purpose. Follow the folder conventions in Section 6 & `AGENTS.md`:
  - Tunable/constant values (timeouts, iteration counts, limits, page sizes) → `src/constants.ts` (or `src/constants/`). Never hardcode magic numbers inline.
  - Shared TypeScript types/interfaces → `src/types/`.
  - Reusable logical units (clients, adapters, framework instances) → `src/lib/`.
  - Pure utility/helper functions → `src/utils/`.
  - External/data operations (DB, Cloudinary, OCR) → `src/services/`.
  - Request/response orchestration (server functions calling services) → `src/server/` (controllers).
  - Do not clutter one file with many functions — split by responsibility into the folders above.

---

## 2. Architecture Overview

```
Browser (React + TanStack Router + shadcn/ui)
  │
  ├─ Direct unsigned upload ────────────────► Cloudinary (returns secure_url + public_id)
  │
  └─ TanStack Start server functions (RPC)
        ├─ Better Auth  (session cookie ↔ Postgres)
        ├─ Drizzle ORM  ──────────────────────► Neon Postgres
        └─ OCR proxy    ──────────────────────► OCR.space API (server-side, key hidden)
```

**Image + OCR flow (important):**
1. Browser uploads the image directly to Cloudinary (unsigned preset). Cloudinary returns `secure_url` + `public_id`.
2. Browser calls a server function `ocrFromImageUrl({ imageUrl })`.
3. Server calls OCR.space with the Cloudinary `url` param + API key, parses text, returns a transient best-guess `{ name, phone }`. Raw OCR text is **not** persisted.
4. Browser pre-fills the create-card form. User edits/confirms. On submit, the card (including `imageUrl` + `imagePublicId`) is saved via `createCard`.

This keeps the OCR key server-side while still using unsigned client uploads.

---

## 3. Data Model

Better Auth owns its own tables (`user`, `session`, `account`, `verification`) — generated via its Drizzle schema. Application tables:

```
categories
  id          uuid  pk  default gen_random_uuid()
  user_id     text  fk -> user.id  (cascade on delete)  not null
  name        text  not null
  color       text  null            -- optional hex for UI chips
  created_at  timestamptz not null default now()
  updated_at  timestamptz not null default now()
  UNIQUE (user_id, name)

cards
  id            uuid  pk  default gen_random_uuid()
  user_id       text  fk -> user.id  (cascade on delete)  not null
  name          text  not null
  phone         text  null
  email         text  null
  company       text  null
  notes         text  null
  category_id   uuid  fk -> categories.id  (set null on delete)  null
  image_url     text  null            -- Cloudinary secure_url
  image_public_id text null           -- Cloudinary public_id (for delete/transform)
  created_at    timestamptz not null default now()
  updated_at    timestamptz not null default now()

Indexes:
  cards(user_id)
  cards(user_id, category_id)
  cards(user_id, name)
```

> `phone` is stored as free text (cards have varied formats/extensions). Normalization/search handled at query time.

---

## 4. Environment Variables

Create `.env` (git-ignored) and keep `.env.example` (committed, no secrets).

```
# Database
# Dev: Docker Postgres (see docker-compose in Phase 2). Prod: Neon pooled connection string.
DATABASE_URL=postgres://cardholder:cardholder@localhost:5432/cardholder

# Better Auth
BETTER_AUTH_SECRET=            # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000

# Cloudinary (PUBLIC — safe to expose to client)
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=      # unsigned preset

# Cloudinary (SERVER ONLY — for deletes/signing later; do NOT prefix with VITE_)
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# OCR.space (SERVER ONLY)
# Free public endpoint works with the shared demo key "helloworld" (no signup).
# Leave as helloworld for now; swap in a real key later without code changes.
OCR_SPACE_API_KEY=helloworld
```

Rules:
- **All env access goes through a validated, typed schema using `@t3-oss/env-core`** (t3-env) in `src/env.ts` — never read `process.env` / `import.meta.env` directly in app code. Import `env` from `src/env.ts` instead.
- `VITE_`-prefixed vars are bundled into client code → only non-secret values.
- Everything else is server-only and must never be imported into client components.
- Non-secret tunables (timeouts, page sizes, upload limits, OCR endpoint URL) go in `src/constants.ts`, **not** env vars — env is for secrets and per-environment values only.

### Typed env with t3-env (`src/env.ts`)
Use `@t3-oss/env-core` with Zod to validate at boot and get autocompletion. Split server vs client and set the client prefix to `VITE_`:

```ts
// src/env.ts (shape sketch — follow current t3-env docs for exact API)
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    OCR_SPACE_API_KEY: z.string().default("helloworld"),
  },
  clientPrefix: "VITE_",
  client: {
    VITE_CLOUDINARY_CLOUD_NAME: z.string().min(1),
    VITE_CLOUDINARY_UPLOAD_PRESET: z.string().min(1),
  },
  runtimeEnv: import.meta.env, // Vite; server vars still resolve at runtime
  emptyStringAsUndefined: true,
});
```
- Server-only keys must **not** be referenced from client bundles; t3-env enforces this separation at build/runtime.
- Add validation so a missing/invalid env fails fast on startup rather than at first use.

---

## 5. Phases

Each phase has: **Goal → Tasks → Deliverables → Acceptance Criteria → Review Checkpoint.** Complete the checkpoint (commit + verify) before starting the next phase.

---

### Phase 0 — Project Scaffolding & Tooling

**Goal:** A running TanStack Start app with TypeScript strict mode, linting, formatting, and a clean git history.

**Tasks:**
1. Scaffold TanStack Start (React + TypeScript) **using pnpm** (`pnpm create` / `pnpm dlx` per current docs). Use the official create command; if versions differ, follow current TanStack Start docs (https://tanstack.com/start).
2. Initialize git; add `.gitignore` (node_modules, `.env`, `.env.*` except `.env.example`, build output, `.vinxi`/`.output`, `.tanstack`).
3. Enable TypeScript `strict: true` and `noUncheckedIndexedAccess: true` in `tsconfig.json`.
4. Add scripts to `package.json` (all run via pnpm): `dev`, `build`, `start`, `typecheck`, `lint`, `format`, `db:up`, `db:down`, `db:generate`, `db:migrate`, `db:studio` (db scripts wired in Phase 2).
5. Add ESLint + Prettier (or Biome — pick one, document it). Add `format` + `lint`.
6. Create `.env.example` with the keys from Section 4. Install `@t3-oss/env-core` + `zod` and create `src/env.ts` (typed, validated env per Section 4). Create `src/constants.ts` and the empty folders `src/types/`, `src/utils/`, `src/services/` (with a `.gitkeep` or index) so the conventions are in place from the start.
7. Verify the dev server boots and renders a placeholder home route, and that invalid/missing env fails fast with a clear error.

**Deliverables:** Bootable app, committed baseline.

**Acceptance Criteria:**
- `pnpm dev` serves the app locally without errors.
- `pnpm typecheck` passes.
- `.env` is git-ignored; `.env.example` is committed.

**Review Checkpoint:** Commit `chore: scaffold TanStack Start app`. Pause for review.

---

### Phase 1 — Styling Foundation (Tailwind v4 + shadcn/ui)

**Goal:** Tailwind v4 wired via Vite plugin; shadcn/ui initialized with a base theme and a few core components.

**Tasks:**
1. Install and configure Tailwind CSS v4 using `@tailwindcss/vite`. Add the single `@import "tailwindcss";` entry CSS. (Tailwind v4 is config-light — no `tailwind.config.js` required unless customizing.)
2. Initialize shadcn/ui (`npx shadcn@latest init`) targeting the TanStack Start structure. Configure `components.json` with correct path aliases (`@/components`, `@/lib`).
3. Set up path aliases in `tsconfig.json` + Vite so `@/*` resolves to `src/*`.
4. Add base components used throughout: `button`, `input`, `label`, `textarea`, `select`, `dialog`, `dropdown-menu`, `card`, `sonner` (toasts), `form`, `badge`, `avatar`, `skeleton`.
5. Add a root layout with light/dark theme support (CSS variables + a theme toggle stub is optional this phase).
6. Build a simple styled landing/home page to confirm Tailwind classes and shadcn components render correctly.

**Deliverables:** Working design system baseline.

**Acceptance Criteria:**
- A shadcn `Button` and `Input` render with correct styling.
- Tailwind utility classes apply (verify a `bg-*`/`p-*` on the page).
- `pnpm build` succeeds.

**Review Checkpoint:** Commit `feat: tailwind v4 + shadcn/ui foundation`. Pause.

---

### Phase 2 — Database Layer (Docker Postgres in dev + Drizzle)

**Goal:** A local Postgres running in Docker for development, Drizzle connected to it via `DATABASE_URL`, migrations working, app tables created. The same code targets Neon in production (Phase 8) with no schema changes.

**Tasks:**
1. Add a `docker-compose.yml` at the repo root with a `postgres:16` service: db `cardholder`, user `cardholder`, password `cardholder`, port `5432:5432`, and a named volume for persistence. Add `pnpm db:up` / `pnpm db:down` scripts (wrapping `docker compose up -d` / `down`).
2. Install `drizzle-orm`, `drizzle-kit`, and the Neon serverless driver (`@neondatabase/serverless`). Use a driver setup that works for **both** environments:
   - **Dev:** node-postgres (`pg`) against the local Docker Postgres, **or** Neon's driver pointed at local — pick one and document it. Simplest: use `pg` driver in dev and Neon HTTP driver in prod, selected via env (`NODE_ENV`/a `DB_DRIVER` constant in `src/constants.ts`). Keep the selection logic in `src/db/index.ts` so callers just import `db`.
3. Create `src/db/index.ts`: instantiate Drizzle reading `DATABASE_URL`. Export a typed `db` client.
4. Create `src/db/schema.ts` with the `categories` and `cards` tables per Section 3. (Auth tables added in Phase 3.)
5. Create `drizzle.config.ts` (schema path, out dir `./drizzle`, dialect `postgresql`, `dbCredentials` from `DATABASE_URL`).
6. Wire scripts: `db:generate` (drizzle-kit generate), `db:migrate` (apply), `db:studio`, `db:up`, `db:down`.
7. Start Docker Postgres, generate the first migration, and apply it locally.
8. Add a tiny server-side smoke check (a script or a temporary server function) that runs `select 1` / counts rows to confirm connectivity.

**Deliverables:** Local Dockerized Postgres, live dev schema, reproducible migrations in `./drizzle`, portable `db` client.

**Acceptance Criteria:**
- `pnpm db:up` starts Postgres; the app connects using `DATABASE_URL`.
- `pnpm db:generate` produces migration SQL for `categories` + `cards`.
- `pnpm db:migrate` applies cleanly to the local database.
- Drizzle Studio (`pnpm db:studio`) lists the tables.

**Review Checkpoint:** Commit `feat: dockerized postgres + drizzle schema and migrations`. Pause.

---

### Phase 3 — Authentication (Better Auth)

**Goal:** Email + password login protecting the whole app; sessions persisted in Postgres; a helper to get the current user inside server functions.

**Tasks:**
1. Install `better-auth`. Configure the server instance in `src/lib/auth.ts` with the Drizzle adapter (Postgres) and email+password enabled.
2. Generate Better Auth's Drizzle schema (its CLI) into `src/db/schema.ts` (or a dedicated `auth-schema.ts` re-exported from schema). Generate + apply a migration for `user`, `session`, `account`, `verification`.
3. Mount the Better Auth handler at the framework's API route (e.g. `src/routes/api/auth/$.ts`) so `/api/auth/*` works.
4. Create `src/lib/auth-client.ts` (client SDK) for sign-in/sign-out/session hooks.
5. Build `/login` and `/signup` routes using shadcn `form` + `input`. (Signup can be disabled or left open — since single-user, optionally guard signup behind an env flag `ALLOW_SIGNUP`.)
6. Add a server helper `requireUser()` that reads the session from the request and throws/redirects if unauthenticated. Use it in every protected server function and loader.
7. Protect app routes: unauthenticated users are redirected to `/login`. Add a sign-out button in the app shell.
8. Manually create the single user account (via signup once), then optionally set `ALLOW_SIGNUP=false`.

**Deliverables:** Working auth, protected routes, `requireUser()` utility.

**Acceptance Criteria:**
- Visiting a protected route while logged out redirects to `/login`.
- Login sets a session; refresh keeps you logged in; logout clears it.
- Session rows appear in the `session` table.

**Review Checkpoint:** Commit `feat: better-auth email/password + route protection`. Pause.

---

### Phase 4 — Categories (Managed CRUD)

**Goal:** Full CRUD for categories, user-scoped, with validation. Categories are selectable when creating cards later.

**Tasks:**
1. Define Zod schemas in `src/lib/validators/category.ts` (`createCategory`, `updateCategory`). Name: required, trimmed, 1–50 chars.
2. Server functions in `src/server/categories.ts`:
   - `listCategories()` → all categories for `requireUser()`, ordered by name.
   - `createCategory(input)` → insert with `userId`; handle unique `(user_id, name)` violation with a friendly error.
   - `updateCategory(id, input)` → update only if row.userId === user.id.
   - `deleteCategory(id)` → delete only own row (cards' `category_id` set null via FK).
   - Every function calls `requireUser()` and scopes by `userId`.
3. UI: a `/categories` route — list with counts, "Add category" dialog, inline edit, delete confirm dialog. Use `sonner` toasts for success/error. Optional color picker for `color`.
4. Optimistic or refetch-on-success updates via TanStack Router loaders / query invalidation.

**Deliverables:** Category management page.

**Acceptance Criteria:**
- Can create, rename, and delete categories; duplicates (same name) are rejected with a clear message.
- Deleting a category does not delete cards (their `category_id` becomes null).
- A second (test) user cannot see or mutate the first user's categories (verify by scoping logic/manual test).

**Review Checkpoint:** Commit `feat: category CRUD`. Pause.

---

### Phase 5 — Cards CRUD + Cloudinary Upload (Manual Flow)

**Goal:** The core feature — create/read/update/delete cards with an uploaded image. This is the **MVP flow: all card data is entered via the manual form.** (OCR is deferred — see Phase 6.)

**Tasks:**
1. **Cloudinary upload service** `src/services/cloudinary.ts`: an `uploadImage(file)` helper that POSTs to `https://api.cloudinary.com/v1_1/<cloud_name>/image/upload` with the unsigned `upload_preset`, using `VITE_CLOUDINARY_CLOUD_NAME` + `VITE_CLOUDINARY_UPLOAD_PRESET`. Returns `{ secureUrl, publicId }`. Validate file type (jpg/png/webp) and size against limits from `src/constants.ts` (e.g. `MAX_IMAGE_BYTES`) before upload. Server-side Cloudinary calls (signed delete) live in the same service, split cleanly from the client-safe upload helper.
2. **Validators** `src/lib/validators/card.ts`: `createCard` / `updateCard`. `name` required (1–120). `phone`, `email`, `company`, `notes` optional (email format if present). `categoryId` optional uuid. `imageUrl`/`imagePublicId` optional strings. Field length limits come from `src/constants.ts`.
3. **Server functions (controllers)** `src/server/cards.ts` (all `requireUser()` + user-scoped) — thin orchestration that delegates DB work to `src/services/`:
   - `listCards({ search?, categoryId?, sort? })` → filter by name/phone `ilike` search, optional category, sort by `created_at`/`name`.
   - `getCard(id)`
   - `createCard(input)`
   - `updateCard(id, input)`
   - `deleteCard(id)` → delete row; also attempt Cloudinary asset delete via server-side signed call using `image_public_id` (best-effort; log failures, don't block).
4. **Card form component** (shared for create + edit): image dropzone/upload with preview + progress, name, phone, email, company, category `select` (populated from `listCategories`), notes. Submit calls `uploadImage` first (if a new file), then `create/updateCard`.
5. **Routes:**
   - `/` or `/cards` — grid/list of cards (image thumbnail, name, phone, category badge). Empty state + "Add card" CTA.
   - `/cards/new` — create form.
   - `/cards/$id` — detail view (large image, all fields, edit + delete actions).
   - `/cards/$id/edit` — edit form.
6. Use Cloudinary URL transformations for thumbnails (e.g. `c_fill,w_400,h_250`) to keep the grid fast.
7. Toasts + loading/skeleton states + delete confirmation dialog.

**Deliverables:** End-to-end manual card management with images.

**Acceptance Criteria:**
- Can create a card with an image; the image uploads to Cloudinary and the thumbnail renders in the list.
- Can edit all fields (including replacing the image) and delete a card.
- Deleting a card removes it from the list; Cloudinary asset deletion attempted.
- Cards are user-scoped (no cross-user access).
- Server rejects invalid input even if client validation is bypassed.

**Review Checkpoint:** Commit `feat: cards CRUD with cloudinary upload`. Pause.

---

### Phase 6 — OCR Assist (DEFERRED / Post-MVP)

> **Status: NOT part of the initial build.** The MVP relies entirely on the manual form (Phase 5). Do **not** implement this phase unless explicitly asked. It is documented here so the architecture stays ready for it. Raw OCR text is **never stored** — OCR output is used transiently to pre-fill the form and then discarded, so no schema change is needed when this lands.

**Future goal:** Let the user *optionally* auto-fill the card form from the uploaded image. OCR is a convenience only — the manual form is always authoritative.

**Planned approach (when revisited):** OCR will be **paired with an AI endpoint** for best results — raw OCR text (from OCR.space) is passed to an LLM/AI extraction endpoint that returns structured fields (`name`, `phone`, `email`, `company`) far more reliably than regex heuristics. The OCR text is used in-memory only and not saved. Design it as a two-step service so either step can be swapped:
1. **OCR step** — `src/services/ocr.ts` → `ocrFromImageUrl({ imageUrl })`. POST to OCR.space `https://api.ocr.space/parse/image`, `apikey` header = `OCR_SPACE_API_KEY` (defaults to the free shared `helloworld`), image via the `url` param (Cloudinary `secure_url`), `language=eng`, `OCREngine=2`, `scale=true`. All tunables (endpoint, engine, timeout) live in `src/constants.ts`. Returns `{ ok, text }` (transient).
2. **AI extraction step** — `src/services/card-extraction.ts` → takes the OCR text, calls the AI endpoint, returns structured `{ name?, phone?, email?, company? }`. Keep the provider behind a small interface so it's swappable.
3. **Controller** `src/server/ocr.ts` orchestrates step 1 → step 2 (both `requireUser()`), returns the structured guess. No raw text is returned to be stored.
4. **UI:** after Cloudinary upload, a "Scan card" action pre-fills only **empty** form fields (never overwrites user edits). Any failure/rate-limit → non-blocking toast, manual entry proceeds.

**Acceptance Criteria (future):**
- Scanning a clear card pre-fills reasonable fields via the OCR→AI pipeline.
- OCR/AI failures never block manual card creation.
- OCR + AI keys are used server-side only (absent from client bundle).

**Review Checkpoint:** (Only when implemented) Commit `feat: ocr + ai card extraction assist`.

---

### Phase 7 — List Experience: Search, Filter, Sort, Polish

**Goal:** Make the card list genuinely useful for retrieval — the whole point of the app.

**Tasks:**
1. Search box (debounced) → filters by name/phone via server `ilike`.
2. Category filter (dropdown/segmented) → filters by `categoryId`; "All" option.
3. Sort control → newest, oldest, name A–Z.
4. Reflect search/filter/sort in the URL query params (shareable/bookmarkable, survives refresh) via TanStack Router search params.
5. Empty states (no cards yet vs. no results for filter), loading skeletons, and responsive grid (mobile-first — this app is often used on a phone).
6. Card detail: click-to-call `tel:` link on phone, click-to-copy, and open full image.
7. Optional: pagination or infinite scroll if the list grows (design the server function to accept `limit`/`offset` or cursor from the start).

**Deliverables:** Polished, fast retrieval UX.

**Acceptance Criteria:**
- Searching "john" or a phone fragment narrows results correctly.
- Category filter + sort combine correctly and persist in the URL.
- Layout works well on mobile and desktop.

**Review Checkpoint:** Commit `feat: search, filter, sort + list polish`. Pause.

---

### Phase 8 — Deployment (Cloudflare or Vercel)

**Goal:** Ship it. Decide the target now; the app is portable either way.

**Common prep:**
- Ensure all env vars from Section 4 are set in the hosting provider dashboard (server secrets NOT prefixed with `VITE_`).
- Set `BETTER_AUTH_URL` to the production URL; add production origin to Better Auth `trustedOrigins`.
- Point `DATABASE_URL` at the production Neon database; run migrations against it (`db:migrate`) as part of deploy.
- In Cloudinary, confirm the unsigned upload preset is enabled and (optionally) restrict allowed formats/max file size on the preset.

**Option A — Cloudflare:**
1. Configure TanStack Start's Cloudflare deployment target (Nitro/Vinxi Cloudflare preset per current docs). Add `wrangler.jsonc` with `compatibility_flags = ["nodejs_compat"]` and a recent `compatibility_date`.
2. Set secrets via `wrangler secret put` (or dashboard). Neon HTTP driver works on Workers — confirm no Node-only APIs leak into the Worker.
3. Deploy; run production migration; smoke test auth + upload + OCR.

**Option B — Vercel:**
1. Configure the Vercel deployment target/preset for TanStack Start.
2. Add env vars in the Vercel project (Production + Preview).
3. Deploy; run production migration; smoke test auth + upload + OCR.

**Acceptance Criteria:**
- Production URL loads, login works, a card can be created with image + OCR, and it persists.
- No secrets present in the client bundle.

**Review Checkpoint:** Commit `chore: deployment config for <target>`. Tag a release.

---

### Phase 9 — Hardening & Quality

**Goal:** Robustness, security, and maintainability pass.

**Tasks:**
1. **Security:** re-audit that every server function calls `requireUser()` and scopes by `userId`; confirm no server-only env var is imported into client code; verify Cloudinary/OCR secrets absent from the bundle (`pnpm build` then grep the output).
2. **Error handling:** consistent error boundaries, 404/not-found routes, friendly toasts, and server functions returning typed errors.
3. **Validation:** confirm Zod parity between client and server for all mutations.
4. **Rate/abuse safety:** basic guard on OCR calls; reasonable image size limits enforced both client-side and via Cloudinary preset.
5. **Accessibility:** labels on all inputs, focus management in dialogs, keyboard nav, color-contrast for category chips.
6. **Testing (lightweight):** unit tests for OCR parse heuristics and Zod validators; a couple of integration tests for `createCard`/`listCards` scoping. (Vitest.)
7. **Docs:** update `README.md` with setup, env vars, scripts, and deploy steps. Keep `.env.example` current.
8. **CI (optional):** GitHub Action running `typecheck` + `lint` + tests on PRs.

**Acceptance Criteria:**
- `pnpm typecheck`, `lint`, and tests pass.
- No secret strings in the production bundle.
- README lets a fresh clone run locally from scratch.

**Review Checkpoint:** Commit `chore: hardening, tests, docs`. Final review.

---

## 6. Project Structure & Code Organization

Follow this layout. **Keep files small and single-purpose** — split by responsibility instead of piling many functions into one file.

```
cardholder/
├─ src/
│  ├─ routes/                       # TanStack Router file-based routes (thin; call server fns)
│  │  ├─ __root.tsx
│  │  ├─ index.tsx                  # cards list (or redirect to /cards)
│  │  ├─ login.tsx
│  │  ├─ signup.tsx
│  │  ├─ categories.tsx
│  │  ├─ cards/
│  │  │  ├─ new.tsx
│  │  │  ├─ $id.tsx
│  │  │  └─ $id.edit.tsx
│  │  └─ api/
│  │     └─ auth/$.ts               # Better Auth handler
│  ├─ server/                       # CONTROLLERS: server functions (RPC), thin orchestration
│  │  ├─ cards.ts                   # calls services, returns typed results
│  │  ├─ categories.ts
│  │  └─ ocr.ts                     # (deferred phase)
│  ├─ services/                     # DATA/EXTERNAL operations (DB queries, Cloudinary, OCR, AI)
│  │  ├─ card.service.ts            # drizzle queries for cards
│  │  ├─ category.service.ts        # drizzle queries for categories
│  │  ├─ cloudinary.ts              # upload (client-safe) + signed delete (server)
│  │  ├─ ocr.ts                     # (deferred) OCR.space call
│  │  └─ card-extraction.ts         # (deferred) AI extraction from OCR text
│  ├─ db/
│  │  ├─ index.ts                   # drizzle client (pg in dev, Neon in prod)
│  │  └─ schema.ts                  # app + auth tables
│  ├─ lib/                          # REUSABLE LOGICAL UNITS (framework instances, singletons)
│  │  ├─ auth.ts                    # Better Auth server instance
│  │  ├─ auth-client.ts
│  │  ├─ require-user.ts
│  │  └─ validators/                # Zod schemas
│  │     ├─ card.ts
│  │     └─ category.ts
│  ├─ utils/                        # PURE HELPERS (formatting, phone/text helpers, guards)
│  │  ├─ format.ts
│  │  └─ cloudinary-url.ts          # build transformation URLs (pure)
│  ├─ types/                        # SHARED TypeScript types/interfaces
│  │  ├─ card.ts
│  │  ├─ category.ts
│  │  └─ api.ts                     # shared result/error shapes
│  ├─ constants.ts                  # ALL tunables/constants (timeouts, limits, page sizes, URLs)
│  ├─ env.ts                        # t3-env: typed + validated environment variables
│  ├─ components/
│  │  ├─ ui/                        # shadcn components
│  │  ├─ card-form.tsx
│  │  ├─ card-grid.tsx
│  │  └─ app-shell.tsx
│  └─ styles/app.css                # @import "tailwindcss";
├─ docker-compose.yml               # dev Postgres
├─ drizzle/                         # generated migrations
├─ drizzle.config.ts
├─ .env.example
├─ components.json                  # shadcn config
├─ wrangler.jsonc                   # if Cloudflare
├─ AGENTS.md                        # working conventions for the implementing agent
├─ README.md
└─ PLAN.md
```

### Folder responsibility rules (must follow)
- **`constants.ts`** — every changeable/constant value: timeouts, iteration/retry counts, page sizes, max upload bytes, allowed MIME types, OCR endpoint/engine, field length limits. **No magic numbers inline.**
- **`types/`** — all shared interfaces/types. Import from here; don't redefine ad-hoc shapes across files.
- **`lib/`** — reusable logical units and singletons (auth instance, validators, `require-user`). Instantiated things you reuse.
- **`utils/`** — pure, side-effect-free helper functions. Easy to unit test.
- **`services/`** — where external I/O lives (Drizzle queries, Cloudinary, OCR, AI). One concern per file.
- **`server/`** — controllers: server functions that auth (`requireUser`), validate (Zod from `lib/validators`), call `services/`, and return typed results. Keep them thin.
- **One responsibility per file.** If a file grows many unrelated functions, split it into the appropriate folder above.

---

## 7. Definition of Done (whole project)

- Single-user login protects the app; sessions persist in Postgres.
- **All card data entered via the manual form** (OCR not required for MVP).
- Create/edit/delete cards with image upload to Cloudinary and thumbnails in the list.
- Managed categories; cards filter by category.
- Search by name/phone; sort; state persisted in URL.
- Dev runs on Docker Postgres; production runs on Neon; migrations run in both.
- Deployed to the chosen host.
- No secrets in the client bundle; all mutations user-scoped and server-validated.
- Code follows the folder conventions (constants/types/lib/utils/services/server); no magic numbers inline.
- README enables a clean-clone local setup.

---

## 8. Notes for the Implementing Agent

- **Use pnpm for everything** (`pnpm install`, `pnpm dev`, `pnpm dlx ...`). Do not use npm/yarn.
- **Work strictly phase by phase.** Finish a phase, meet its acceptance criteria, commit with the suggested message, then stop for review before continuing.
- **OCR (Phase 6) is deferred — do not build it now.** The MVP uses the manual form. When revisited, OCR will be paired with an AI extraction endpoint, and OCR text is used transiently (never stored). Keep the architecture ready, but implement nothing OCR-related unless explicitly asked.
- **Prefer current official docs** for exact commands/versions (TanStack Start, Tailwind v4, shadcn/ui, Drizzle, Better Auth, Neon) since versions move fast. Do not hardcode versions that conflict with the latest scaffolding output.
- **Keep server-only modules out of client components.** If a module imports `OCR_SPACE_API_KEY` or `CLOUDINARY_API_SECRET`, it must only ever run in a server function.
- **Always scope by `userId`** and call `requireUser()` in every server function — no exceptions.
- **Respect the folder conventions:** constants → `constants.ts`, types → `types/`, reusable units → `lib/`, pure helpers → `utils/`, external I/O → `services/`, controllers → `server/`. Keep files small and single-purpose. See `AGENTS.md`.
- **Ask before deviating** from a confirmed decision in Section 1.
