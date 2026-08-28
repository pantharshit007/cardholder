# AGENTS.md — CardHolder Working Conventions

Focused rules for any agent working in this repo. Read `PLAN.md` for the full phased plan. This file is the short, enforceable checklist.

## Project
CardHolder: a personal app to store visiting/business cards (name, phone, category, image). Card data is entered via a **manual form**. Images go to Cloudinary; metadata to Postgres.

## Stack (do not change without asking)
- **pnpm** package manager (never npm/yarn)
- **TanStack Start** + **TypeScript** (strict)
- **Tailwind CSS v4** (`@tailwindcss/vite`) + **shadcn/ui**
- **Postgres**: **Docker Postgres in dev**, **Neon** in prod
- **Drizzle ORM** + `drizzle-kit`
- **Better Auth** (email + password)
- **Cloudinary** unsigned direct-to-browser upload
- **Env**: **t3-env** (`@t3-oss/env-core` + Zod) — typed/validated in `src/env.ts`; never read `process.env`/`import.meta.env` directly
- **OCR: deferred** (post-MVP; will later be paired with an AI endpoint)

## Commands (always pnpm)
```
pnpm install
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm db:up        # start docker postgres
pnpm db:down
pnpm db:generate  # drizzle migration
pnpm db:migrate
pnpm db:studio
```

## Golden rules
1. **Work phase by phase** (see `PLAN.md`). Meet acceptance criteria, don't commit without user permission. Never pull future-phase work forward.
2. **Do NOT build OCR now.** MVP = manual form only. Implement OCR only when explicitly asked. When built, it pairs OCR.space (`apikey: helloworld` free endpoint) with an AI extraction step; OCR text is used transiently and **never stored**.
3. **Auth on every mutation.** Every server function calls `requireUser()` and scopes queries by `userId`. Never return another user's rows.
4. **Server-side validation.** Re-validate every input with Zod (from `lib/validators/`) in the server function, regardless of client validation.
5. **Secrets stay server-side.** Only `VITE_`-prefixed env (Cloudinary cloud name + unsigned preset) may reach the client. `CLOUDINARY_API_SECRET`, `OCR_SPACE_API_KEY`, `BETTER_AUTH_SECRET`, `DATABASE_URL` are server-only. Access all env through the typed `src/env.ts` (t3-env) — never `process.env`/`import.meta.env` directly.

## Code organization (enforced)
Keep files small and single-purpose. Split by responsibility:

| Put it in | When it is... |
| --- | --- |
| `src/constants.ts` | any changeable/constant value: timeouts, retry/iteration counts, page sizes, max upload bytes, allowed MIME types, endpoint URLs, field length limits. **No magic numbers inline.** |
| `src/types/` | shared TypeScript types/interfaces |
| `src/lib/` | reusable logical units / singletons (auth instance, validators, `require-user`) |
| `src/utils/` | pure, side-effect-free helper functions |
| `src/services/` | external I/O: Drizzle queries, Cloudinary, OCR, AI |
| `src/server/` | controllers: server functions that auth → validate → call services → return typed result (keep thin) |
| `src/components/` | React components (`ui/` = shadcn) |
| `src/routes/` | thin route/loaders that call server functions |

- If a file accumulates many unrelated functions, split it into the folders above.
- Import types from `types/`; don't redefine shapes ad-hoc.
- No hardcoded tunables — reference `constants.ts`.

## Data model (summary)
- `categories(id, user_id, name, color?, timestamps)` — unique `(user_id, name)`
- `cards(id, user_id, name, phone?, email?, company?, notes?, category_id?, image_url?, image_public_id?, timestamps)`
- Better Auth owns `user/session/account/verification`.

## Definition of "done" for a change
- `pnpm typecheck` + `pnpm lint` pass.
- New logic placed in the correct folder per the table above.
- Server functions auth + validate + user-scope.
- No secret values in client bundle.
- Committed with a clear, conventional message.
