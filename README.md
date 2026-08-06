# Finapse

A personal finance dashboard that securely connects to your bank accounts (via [Plaid](https://plaid.com)), syncs transactions, and turns them into clear spending insights — categorized transactions, budgets, and a dashboard of where your money actually goes.

Built as a full-stack project: a TypeScript monorepo with a React front end, an Express/Prisma API, PostgreSQL, JWT + Google OAuth auth, and encrypted-at-rest bank tokens.

> **Note:** This is a personal, single-user project. Production Plaid access runs against real bank data locally; a public demo can run against Plaid's Sandbox with test credentials (`user_good` / `pass_good`).

## Screenshots

![Dashboard](docs/images/dashboard.png)

![Transactions](docs/images/transactions.png)

![Budgets](docs/images/budgets.png)

## Features

- **Bank connections via Plaid** — link accounts through Plaid Link.
- **Transaction sync** — pulls accounts and transactions, with an optional signed webhook receiver for auto-sync.
- **Spending dashboard** — spending/income/net totals, spending-by-category breakdown, and a spending-over-time chart. Internal transfers and credit-card payments are excluded so totals reflect real spending, not money moved between your own accounts.
- **Smart categorization** — Plaid's personal-finance categories, a recurring/subscription heuristic, and per-transaction overrides. Recategorizing a transaction can apply that category to every transaction from the same merchant (past and future).
- **Budgets** — per-category monthly budgets with spent-vs-limit tracking.
- **Auth** — email/password (bcrypt + JWT in HTTP-only cookies) and Google OAuth, with email verification and password reset.

## Tech stack

| Layer     | Tech                                                                         |
| --------- | ---------------------------------------------------------------------------- |
| Front end | React 19, Vite 7, React Router 7, TanStack Query, Tailwind CSS 4, TypeScript |
| Back end  | Node.js, Express 4, TypeScript, Zod validation                               |
| Database  | PostgreSQL 16, Prisma 7 (ORM + migrations)                                   |
| Auth      | JWT (HTTP-only cookies), Passport Google OAuth, bcrypt                       |
| Banking   | Plaid API (`plaid`, `react-plaid-link`)                                      |
| Tooling   | npm workspaces, ESLint, Prettier, Vitest                                     |

## Architecture

Monorepo managed with npm workspaces:

```
finapse/
├── apps/
│   ├── api/        # Express + Prisma REST API
│   │   ├── prisma/ # schema + migrations
│   │   └── src/
│   │       ├── features/   # feature modules: auth, plaid, transaction, health
│   │       ├── middleware/ # auth guard, error handling, rate limiting
│   │       ├── lib/        # Plaid client, encryption
│   │       └── config/     # env helpers
│   └── web/        # React + Vite front end
│       └── src/    # pages, components, hooks, api client, context
├── packages/
│   └── types/      # shared TypeScript types
└── docs/           # deeper docs (architecture, api, auth, db, web, testing)
```

The API follows a **Routes → Controllers → Services → Prisma** flow, with request validation via Zod schemas. Bank connections are stored as `PlaidItem` records (encrypted access token); syncing writes `Account` and `Transaction` rows. See [`docs/architecture.md`](docs/architecture.md) for details.

## Getting started

### Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL)
- A [Plaid](https://dashboard.plaid.com) account (Sandbox is free)

### 1. Clone and install

```bash
git clone https://github.com/ryanradtke03/finapse.git
cd finapse
npm install
```

### 2. Start the database

```bash
npm run db:up      # starts PostgreSQL 16 in Docker
```

### 3. Configure environment

The repo uses per-app env files. Copy the examples and fill them in:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Key `apps/api/.env` variables:

- `DATABASE_URL` — e.g. `postgresql://finapse:finapse_password@localhost:5432/finapse_dev?schema=public`
- `JWT_SECRET`, `JWT_EXPIRES_IN` — session signing
- `ENCRYPTION_KEY` — 64-char hex (32 bytes) for encrypting Plaid tokens. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `PLAID_CLIENT_ID`, `PLAID_ENV` (`sandbox` | `production`), and the matching secret (`PLAID_SECRET_SANDBOX` / `PLAID_SECRET_PRODUCTION`, or `PLAID_SECRET`)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — for Google sign-in

`apps/web/.env` needs `VITE_API_URL` (defaults to `http://localhost:3001`).

### 4. Run migrations

```bash
cd apps/api && npm run db:migrate && cd ../..
```

### 5. Start the app

```bash
npm run dev:api                 # API on http://localhost:3001
cd apps/web && npm run dev      # web on http://localhost:5173
```

Open http://localhost:5173, sign up, and link an account. In Sandbox, use Plaid's test credentials (`user_good` / `pass_good`).

## Scripts

Run from the repo root unless noted.

| Command                     | Description                           |
| --------------------------- | ------------------------------------- |
| `npm run dev:api`           | Start the API with hot reload         |
| `npm run db:up` / `db:down` | Start / stop PostgreSQL (Docker)      |
| `npm run db:reset`          | Drop and recreate the database        |
| `npm run lint`              | ESLint across all packages            |
| `npm run format`            | Prettier                              |
| `npm run typecheck`         | TypeScript checks across all packages |
| `npm run test`              | Run tests across all packages         |

Prisma commands run from `apps/api/`: `npm run db:migrate`, `npm run db:deploy`, `npm run db:studio`, `npm run prisma:generate`.

## Documentation

More detail lives in [`docs/`](docs/): [architecture](docs/architecture.md), [api](docs/api.md), [auth](docs/auth.md), [database](docs/db.md), [web](docs/web.md), and [testing](docs/testing.md).
