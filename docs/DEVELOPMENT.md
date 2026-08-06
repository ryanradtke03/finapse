# Local Development

Everything runs from the **repo root** — you never need to `cd` into `apps/api`
or `apps/web`, and you never hand-edit `.env` to switch modes. Two modes:

- **Normal** — your day-to-day dev (your own `.env` / bank).
- **Demo** — the public Plaid Sandbox posture (see [DEMO_MODE.md](./DEMO_MODE.md)).

Each mode has its own env file; the scripts pick the right one for you.

---

## Prerequisites

- Node + npm
- Docker (Postgres runs in a container)

## Env files

| File | Purpose | Tracked? |
| --- | --- | --- |
| `apps/api/.env` | Normal API dev | gitignored |
| `apps/api/.env.demo` | Demo API config (separate `finapse_demo` DB) | gitignored |
| `apps/web/.env` | Normal web dev | gitignored |
| `apps/web/.env.demo` | Demo web config (`VITE_DEMO_MODE=true`) | gitignored |
| `*.env*.example` | Committed templates to copy from | tracked |

Copy the templates once and fill in secrets:

```bash
cp apps/api/.env.example       apps/api/.env
cp apps/api/.env.demo.example  apps/api/.env.demo
cp apps/web/.env.example       apps/web/.env
cp apps/web/.env.demo.example  apps/web/.env.demo
```

You fill each once and never touch them again — the scripts select which one
runs.

---

## Scripts (all from the repo root)

| Command | What it does |
| --- | --- |
| `npm run dev` | Postgres (waits until healthy) + API + web, **normal** mode |
| `npm run dev:demo` | Postgres + API + web, **demo** mode |
| `npm run reset:demo` | Drop + recreate + reseed the **demo** database (safe — separate DB) |
| `npm run seed:demo` | Seed the demo account into the demo DB |
| `npm run build` | Build API + web |
| `npm run build:demo` | Build the web with demo flags baked in |
| `npm run db:up` / `db:down` | Start / stop the Postgres container |
| `npm run db:reset` | Tear down the Postgres volume (wipes **all** local DBs) |
| `npm run lint` / `format` / `typecheck` / `test` | Across all workspaces |

Individual halves are also available: `dev:api`, `dev:web`, `dev:api:demo`,
`dev:web:demo`, `build:api`, `build:web`, `start:api`.

`dev` / `dev:demo` run the API and web side by side (via `concurrently`), so one
command and one terminal gets the whole stack up.

---

## Running normally

```bash
npm run dev
```

Brings up Postgres, then the API (`http://localhost:3001`) and the web dev server
(`http://localhost:5173`) together.

## Running the demo locally

First time (creates + migrates + seeds the isolated demo DB):

```bash
npm run reset:demo
```

Then, any time:

```bash
npm run dev:demo
```

Log in with the seeded demo account (**`demo@finapse.com` / `demo1234`**) or the
"Try the demo" button. See [DEMO_MODE.md](./DEMO_MODE.md) for what demo mode
changes and the sandbox bank credentials.

To wipe and repopulate the demo data cleanly, run `npm run reset:demo` again —
it only touches the `finapse_demo` database, never your real dev data.

---

## How mode selection works (under the hood)

No hand-editing of env files — each side loads the right one automatically:

- **API** — the demo scripts run through `dotenv-cli -e .env.demo`, so the API
  process gets the demo env. Normal scripts use `apps/api/.env` as usual.
- **Web** — Vite's built-in modes: `vite --mode demo` auto-loads
  `apps/web/.env.demo` (and `.env`), so the demo flags are baked into the build.
- **Isolated demo DB** — `apps/api/.env.demo` points `DATABASE_URL` at a separate
  `finapse_demo` database in the same Postgres container. Prisma creates it on the
  first `reset:demo`. This is why `reset:demo` can never wipe your real data.

The demo flags (`DEMO_MODE`, `PLAID_ENV=sandbox`, `EMAIL_PROVIDER=console`,
`SEED_DEMO`, `VITE_DEMO_MODE`) live explicitly in the `.env.demo` files, so the
file itself documents the mode — no hidden defaults.
