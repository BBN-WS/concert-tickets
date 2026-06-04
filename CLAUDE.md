# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> The `@AGENTS.md` import above is load-bearing: this repo pins **Next.js 16** and
> **React 19**, whose App Router APIs differ from older versions. Read the relevant
> guide in `node_modules/next/dist/docs/` before writing framework code. See the
> Next.js 16 gotchas section below for the conventions already used here.

## Project overview

TicketBox — a Thai-language concert ticket booking demo. Users browse concerts,
pick individual seats from price zones, create a booking, run a mock payment, and
get a QR e-ticket. Admins create/delete concerts. All user-facing copy and most
error messages are in Thai.

There are **two parallel implementations of the same app** — keep them conceptually
in sync when changing features:

- **`src/`** — the canonical Next.js app: server-rendered, Prisma + PostgreSQL,
  NextAuth credentials auth. This is what `npm run dev` runs.
- **`docs/`** — a standalone static-HTML rebuild (plain HTML + ES modules, no build
  step) that talks directly to **Supabase** (`supabase-js` + anon key) and relies on
  Postgres Row Level Security for authz. Deployed to GitHub Pages. See `docs/README.md`.
  This is a separate stack; do not import between `src/` and `docs/`.

## Commands

```bash
npm install          # also runs `prisma generate` via the postinstall hook
npm run dev          # start dev server at http://localhost:3000
npm run build        # production build
npm run start        # serve the production build
npm run lint         # eslint (flat config, next/core-web-vitals + next/typescript)

npm run db:push      # push prisma/schema.prisma to the database (no migrations dir)
npm run db:seed      # reset + seed demo data (tsx prisma/seed.ts)
node scripts/check-db.mjs   # quick connectivity check: prints concert/user counts
```

There is **no test runner** configured — `lint` and `build` are the checks.

### Environment

Requires a PostgreSQL connection via two env vars (typically `.env`, gitignored):
`DATABASE_URL` (pooled) and `DIRECT_URL` (direct, used by Prisma for migrations/push).

`npm run db:seed` wipes all tables and creates demo logins:
`admin@demo.com / admin1234` (ADMIN) and `user@demo.com / user1234` (USER).

## Architecture

### Data model (`prisma/schema.prisma`)

`User —< Booking >— Concert —< Zone —< BookedSeat`. A `Concert` has price `Zone`s
(each a `rows × seatsPerRow` grid with an integer `price`); a `Booking` (status
`PENDING | PAID | CANCELLED`) holds the `BookedSeat`s a user reserved. Money is
stored as **integer THB** (no decimals) throughout — never use floats for prices.

**Double-booking is prevented at the database level** by `@@unique([zoneId, row,
number])` on `BookedSeat`. The booking route (`src/app/api/bookings/route.ts`)
creates the booking + seats inside a `prisma.$transaction`; a unique-constraint
violation surfaces as Prisma error code `P2002`, which the route maps to HTTP 409.
Rely on this constraint rather than read-then-write checks.

### Auth (`src/lib/auth.ts`, `src/types/next-auth.d.ts`)

NextAuth v4 with the Credentials provider and a **JWT session strategy** (no DB
session table). Passwords are bcrypt-hashed. `id` and `role` are copied into the JWT
and onto `session.user` via callbacks; the `Session`/`JWT` types are augmented in
`src/types/next-auth.d.ts`. Use `getSession()` (re-exported `getServerSession`) in
server code. Authorization is a manual check on `session.user.role === "ADMIN"` —
e.g. the concert-creation route returns 403 otherwise.

### Request flow conventions

- **Reads** happen in Server Components calling Prisma directly (e.g.
  `src/app/concerts/[id]/page.tsx`), which then pass plain serializable props to
  Client Components like `SeatPicker`. Pages that must reflect live booking state set
  `export const dynamic = "force-dynamic"`.
- **Writes** go through Route Handlers under `src/app/api/**`. Each handler:
  validates the body with a **Zod** schema, checks the session, performs the Prisma
  mutation, and returns `NextResponse.json`. Client components POST to these and
  re-route on success.
- The Prisma client is a singleton from `src/lib/db.ts` (cached on `globalThis` in
  dev to survive HMR) — always import `{ prisma }` from there, never `new PrismaClient()`
  in app code.
- Formatting helpers live in `src/lib/format.ts` (`formatTHB`, `formatThaiDate`,
  both `th-TH` locale). Use these for any currency/date display.

### Next.js 16 gotchas (differ from older versions)

- **Dynamic route params and `searchParams` are Promises.** In pages, type as
  `params: Promise<{ id: string }>` and `await` them. In Route Handlers, the context
  uses the generated `RouteContext<"/api/...">` type and `await ctx.params` — see
  `src/app/api/bookings/[id]/pay/route.ts`.
- ESLint uses the **flat config** (`eslint.config.mjs`); run via `eslint` with no args.
- Tailwind v4 is configured through `@tailwindcss/postcss` in `postcss.config.mjs` —
  there is no `tailwind.config` file; styling/theme lives in `src/app/globals.css`.
- Path alias `@/*` → `src/*` (see `tsconfig.json`).

When in doubt about a framework API, consult `node_modules/next/dist/docs/` rather
than relying on memory of earlier Next.js releases.
