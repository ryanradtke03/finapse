# Demo Mode

Finapse can run as a public, zero-signup demo on **Plaid Sandbox**. Demo mode
locks the app into a safe posture — no real bank data, no real email, no open
signups — and funnels every visitor through a shared, pre-seeded demo account.

It's controlled by two env flags (one per app) plus a few supporting settings.

---

## What it changes

| Area | Normal | Demo mode |
| --- | --- | --- |
| Sign up (email/password) | Enabled | **Disabled** (403 + hidden in UI) |
| Change password / delete account / password reset | Enabled | **Disabled** (403) |
| Plaid environment | `production` or `sandbox` | **`sandbox`** (fake data, no cost) |
| Email delivery | Resend (or console) | **Console only** (no real email) |
| Entry point | Register or log in | **"Try the demo"** → shared demo account |
| Connect-a-bank screen | — | Shows Plaid Sandbox credentials hint |

Everything needed to *use* the app — logging in, browsing, filtering,
recategorizing, connecting sandbox banks — stays fully open.

---

## Enabling it

Demo mode is the combination of these settings. Set the API ones in
`apps/api/.env` and the web one in `apps/web/.env` (both are baked in at build
time for the frontend).

**API (`apps/api/.env`)**

```bash
DEMO_MODE=true            # disables signup + destructive auth actions
PLAID_ENV=sandbox         # sandbox test data only
EMAIL_PROVIDER=console    # no real email; links log to the server console
SEED_DEMO=true            # allows the demo account to be seeded
NODE_ENV=production        # (deploys) enables Secure/SameSite=None cookies
TRUST_PROXY=1              # (deploys) per-IP rate limiting behind a proxy
```

**Web (`apps/web/.env`)**

```bash
VITE_DEMO_MODE=true       # hides signup, surfaces sandbox credentials
```

> The backend enforces demo mode regardless of the frontend flag — `VITE_DEMO_MODE`
> only hides UI. Keep the two in sync.

---

## The demo account

Seeded by `apps/api/prisma/seed.ts` (guarded by `SEED_DEMO=true`). Run it once:

```bash
# from apps/api, with PLAID_ENV=sandbox + sandbox credentials set
SEED_DEMO=true npm run db:seed
# convenience script: npm run db:seed:demo
```

It idempotently creates:

- A pre-verified user — **`demo@finapse.com` / `demo1234`** (`emailVerified: true`,
  which is required because Plaid connections are gated behind email verification).
- A connected Plaid Sandbox bank (First Platypus Bank) with exactly three
  accounts — Everyday Checking, Rainy Day Savings and one credit card — plus a
  synthetic ~4-month transaction history.
- A handful of monthly budgets so the Budgets page isn't empty.

### Why three accounts

Plaid's default Sandbox user (`user_good`) returns twelve: CD, money market,
IRA, 401k, HSA, mortgage, student loan, business card and friends. Finapse has
no UI or maths for any of them — they just inflate Total Balance and bury the
everyday cash flow the dashboard is about — and they don't match the person the
demo is meant to show: late-20s/30s, one debit card and one credit card.

Two things keep them out:

1. **The seed mints the Item as a custom Sandbox user.** `DEMO_ACCOUNTS` in
   `prisma/seed.ts` is serialized into Plaid's [custom user config](https://plaid.com/docs/sandbox/user-custom/)
   and passed as `override_username: "user_custom"` + `override_password: <json>`.
   Balances live in that config, so Plaid is the source of truth for them and a
   visitor pressing "Sync now" can't revert the demo to Sandbox's random $110
   checking balance. Because an Item's account lineup is fixed at creation, the
   seed **removes and re-mints** the Item on every run rather than skipping when
   one already exists — otherwise a redeploy would never heal an old Item.
2. **A subtype allowlist at the Plaid boundary.** `plaid.accounts.ts` lists
   what the app models (`depository/checking`, `depository/savings`,
   `credit/credit card`); anything else is dropped in `exchangePublicToken` and
   `syncTransactions` before it reaches the DB. This covers visitors who link
   their own Sandbox bank with `user_good`, and it prunes off-persona accounts
   that an older build already stored, so legacy connections heal on next sync.

On the login screen, the **"Try the demo — no signup"** button logs straight in
with these credentials, so visitors never have to type them.

---

## Connecting a bank (optional, for visitors)

The demo account already has a bank connected, so this is optional. If a visitor
wants to connect their own sandbox bank via Plaid Link, the Accounts page shows a
hint banner with Plaid's **universal sandbox credentials**:

- Username: `user_good`
- Password: `pass_good`
- Any one-time code: `1234`

These are Plaid's standard test credentials — nothing to create or configure.

---

## What's blocked (and why)

`DEMO_MODE=true` applies `blockInDemoMode` (`apps/api/src/middleware/demoGuard.ts`)
to these routes, which return `403 { error: "This action is disabled in the demo." }`:

- `POST /auth/register` — no public signups (primary spam vector)
- `PUT /auth/password` — can't change the shared account's password
- `DELETE /auth/me` — can't delete the shared account
- `POST /auth/forgot-password`, `POST /auth/reset-password` — no reset flow

Additional safety already in place:

- **Rate limiting** (`express-rate-limit`) on auth/email/API routes; set
  `TRUST_PROXY=1` behind a proxy so limits key on the real client IP.
- **Sandbox only** — even if a visitor connects a bank, it's fake data with no
  cost and no access to real accounts.
- **No real email** — verification/reset links only log to the server console.

Never put production Plaid keys or a real mail provider on the public demo.

---

## Deploying (Render)

A `render.yaml` blueprint at the repo root provisions Postgres + the API + the
static frontend with the demo env baked in.

1. Render → **New → Blueprint** → point at this repo.
2. After the first deploy, fill the `sync: false` env vars and redeploy:
   - `ENCRYPTION_KEY` — 64-char hex:
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `PLAID_CLIENT_ID`, `PLAID_SECRET_SANDBOX`
   - `CLIENT_ORIGIN` + `APP_URL` = the web URL
   - `PLAID_WEBHOOK_URL` = API URL + `/api/v1/plaid/webhook`
   - `VITE_API_URL` = API URL + `/api/v1`
3. In the Plaid dashboard, add the webhook URL above.

Notes:

- Render's free tier sleeps after ~15 min idle, so the first request is slow.
- The demo account is **shared** — all visitors see and edit the same data.
  `.github/workflows/demo-reset.yml` resets it nightly for free: it POSTs to
  `finapse-api`'s Render **Deploy Hook**, which triggers a redeploy, and the
  API's `buildCommand` already runs `npm run db:seed` on every deploy (seeding
  is idempotent — it wipes and regenerates visitor edits). Set it up once:
  Render dashboard → `finapse-api` → Settings → Deploy Hook → copy the URL →
  add it as the `RENDER_DEPLOY_HOOK_URL` secret in the GitHub repo's Settings →
  Secrets and variables → Actions. (A dedicated Render Cron Job would also
  work but has no free tier — this reuses the free web service instead.)

---

## Turning it off

Clear the flags (`DEMO_MODE`, `VITE_DEMO_MODE`) and rebuild. Signup, password
management, and account deletion return; the seeded demo account is harmless to
leave in the database or can be deleted manually.
