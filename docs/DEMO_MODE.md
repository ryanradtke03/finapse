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
- A connected Plaid Sandbox bank (First Platypus Bank) with synced transactions.
- A handful of monthly budgets so the Budgets page isn't empty.

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
- The demo account is **shared** — all visitors see and edit the same data. A
  nightly re-seed/reset is recommended to keep it clean (not yet automated).

---

## Turning it off

Clear the flags (`DEMO_MODE`, `VITE_DEMO_MODE`) and rebuild. Signup, password
management, and account deletion return; the seeded demo account is harmless to
leave in the database or can be deleted manually.
