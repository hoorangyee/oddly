# Oddly 🎲

A **prediction-market betting & ranking** app for teams — for fun, with points instead of
real money. Bet on questions (markets) Polymarket-style; whoever predicts best climbs the
leaderboard. No money, just bragging rights.

- **Parimutuel (pool) model** — points staked on each outcome form a pool; winners split the
  total pool in proportion to their stake. The more bets come in, the more the odds (%) move in real time.
- **Multi-tenant** — many organizations run isolated on a single instance. Each org has its own
  markets, members, and leaderboard.
- **Nickname-only join** — members enter with an invite code + nickname (no passwords). Only
  admins act via secret keys.

## Roles

| Role | Auth | Can do |
|------|------|--------|
| Member | Org invite code + nickname | Create markets, bet, comment/react |
| Org admin | Org `adminKey` | Resolve/void markets, reset season |
| Super admin | env `SUPER_ADMIN_KEY` | Create/delete orgs (instance operator) |

## Quick start (local)

```bash
npm install
cp .env.example .env        # fill in values (see below)
npx prisma migrate dev      # create DB + run migrations
npm run db:seed             # seed a demo org/markets/members (optional)
npm run dev                 # http://localhost:3000
```

`db:seed` prints the demo org's credentials (invite code, admin key) to the console.
Open `http://localhost:3000/demo` in your browser to look around.

### Environment variables (`.env`)

```bash
DATABASE_URL="file:./dev.db"          # local: SQLite file / prod: libsql://... (Turso)
DATABASE_AUTH_TOKEN=""                # only needed for Turso in production (empty locally)
SESSION_SECRET="..."                  # signs session cookies (32-byte hex recommended)
SUPER_ADMIN_KEY="..."                 # super admin key = instance operator
```

Generate `SESSION_SECRET`: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## How it works

1. At `/admin`, log in with the super admin key → create an org (invite code + admin key are
   shown **once**).
2. Members join at `/{slug}/join?invite=CODE` with a nickname → they receive the starting balance.
3. Anyone can create a market at `/{slug}/markets/new` (Yes/No or multiple choice).
4. Members bet until the close time → probabilities and payouts update by pool ratio.
5. An org admin **resolves** a market (picks the winning outcome) → automatic settlement
   (the pool is distributed to winners proportionally).
6. Check standings at `/{slug}/leaderboard`. Reset the season to start fresh.

## Points & settlement

- Everyone starts with the same balance; there are no top-ups. The leaderboard ranks by
  **current balance** (= starting balance ± cumulative P&L).
- Settlement: for winning outcome `W`, total pool `T`, and `W`'s pool `P_W`, each winner is paid
  `floor(stake / P_W × T)`. The flooring remainder is distributed by the largest-remainder method,
  so **the total pool is conserved exactly**.
- If nobody bet on the winning outcome, everyone is refunded (void). An admin can also void a
  market to refund all bets.

## Tech stack

- **Next.js 16 (App Router) + TypeScript** · Server Actions · Tailwind CSS v4
- **Prisma 7 + libSQL/SQLite** — a local SQLite file in dev, **Turso** (libSQL) in production. The
  same `@prisma/adapter-libsql` adapter covers both; the schema provider stays `sqlite`.
- Sessions: signed cookies via `jose` (no passwords)
- Settlement logic: `lib/parimutuel.ts` (pure functions, unit-tested with Vitest)

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm test           # unit tests (settlement logic)
npm run db:seed    # seed demo data
npm run db:reset   # reset DB (re-apply migrations)
```

## Deploy (production, multi-tenant) — Turso

The database uses **Turso** (hosted, SQLite-compatible). The schema and migrations are reused
as-is and no code changes are needed — the adapter handles both local `file:` and remote
`libsql://`.

```bash
# 1) Create the Turso database
turso db create oddly
turso db show --url oddly            # → DATABASE_URL (libsql://...)
turso db tokens create oddly         # → DATABASE_AUTH_TOKEN

# 2) Apply the schema (tables) — run the migration SQL as-is
turso db shell oddly < prisma/migrations/*/migration.sql
```

3. Set environment variables on your host (e.g. Vercel): `DATABASE_URL`, `DATABASE_AUTH_TOKEN`,
   `SESSION_SECRET`, `SUPER_ADMIN_KEY` (never commit them).
4. Deploy. The `postinstall` script runs `prisma generate` to produce the client at build time.
5. Log in at `/admin` with the super admin key → create an org. Only someone who knows the super
   admin key can create orgs.

> Prefer standard PostgreSQL (Neon/Supabase)? Switch `schema.prisma`'s provider to `postgresql`,
> swap the `lib/db.ts` adapter to `@prisma/adapter-pg`, and regenerate the migrations.

## License

MIT — see [LICENSE](./LICENSE).
