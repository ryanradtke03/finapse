# Finapse — Tech Overview

A map of everything the project covers. Personal reference / interview cheat-sheet.
Grouped by area, big-ticket items first.

---

## Stack at a glance

| Layer      | Tech                                                                              |
| ---------- | --------------------------------------------------------------------------------- |
| Language   | TypeScript (front to back)                                                         |
| Front end  | React 19, React Router 7, TanStack Query 5, Tailwind CSS 4, Vite 7, Recharts       |
| Back end   | Node.js, Express 4, Zod validation                                                 |
| Database   | PostgreSQL 16 (Docker), Prisma 7 (ORM + migrations)                                |
| Auth       | JWT (httpOnly cookies), Passport Google OAuth, bcrypt                              |
| Banking    | Plaid API (`plaid`, `react-plaid-link`)                                            |
| Email      | Resend (prod) / console provider (demo)                                            |
| Tooling    | npm workspaces, ESLint 9, Prettier, Vitest, GitHub Actions                         |
| Deploy     | Render Blueprint (`render.yaml`) — Postgres + API + static web                     |

---

## Architecture

- **Monorepo** via npm workspaces: `apps/api`, `apps/web`, `packages/types` (shared TS types).
- **API layering:** Routes → Controllers → Services → Prisma. Business logic lives in services; controllers stay thin.
- **Feature-based backend:** `src/features/{auth,plaid,transaction,budget,health}`, each with its own route/controller/service (+ schema).
- **Typed end-to-end** with a shared types package.

## Auth

- **Email + password:** bcrypt hashing (cost 12).
- **JWT sessions** signed with `JWT_SECRET`, stored in **httpOnly cookies** (not localStorage) — XSS can't read them.
- **Google OAuth** via Passport (`passport-google-oauth20`); Google sign-ups are created pre-verified.
- **Email verification + password reset:** single-use tokens, only a **SHA-256 hash** stored in DB (a DB leak can't hand out working links); short expiry.
- **Middleware guards:** `requireAuth` (validates the cookie JWT) and `requireVerifiedEmail` (gates bank connections until email is verified).
- **Object-level authorization:** every `:id` lookup is scoped to the owning `userId` in the service layer — no IDOR (a user can't touch another's records by guessing an ID).

## Security

- **Encryption at rest:** Plaid access tokens encrypted with **AES-256-GCM** (IV + auth tag + ciphertext packed in one colon-delimited field); `ENCRYPTION_KEY` = 32-byte hex.
- **Webhook verification:** Plaid webhooks verified as **ES256 JWTs** — rotating signing key fetched by `kid`, expired keys rejected, **5-minute freshness** window, and a **timing-safe** match of the request-body SHA-256 (blocks replay + payload tampering).
- **Rate limiting** (`express-rate-limit`): global API limiter (300/window), strict auth limiter (10 *failed* attempts), email limiter; keys on real client IP via `TRUST_PROXY`.
- **CORS** allowlist with `credentials: true` for cookie auth.
- **Secrets** kept in env only — never committed; verified clean across full git history. Render keeps them `sync: false` / `generateValue`.

## Plaid / banking integration

- **Plaid Link** for connecting multiple institutions; **public-token exchange** → encrypted access token stored as a `PlaidItem`.
- **Cursor-based `/transactions/sync`** with **added / modified / removed** delta processing; full-resync fallback for schema backfills.
- **Reauth handling:** `item.login_required` webhook flips item to `NEEDS_REAUTH`.
- **Signed webhook receiver** for auto-sync (see Security).

## Database (Prisma / Postgres)

- **Models:** `User`, `Token`, `PlaidItem`, `Account`, `Transaction`, `Budget`, `MerchantCategoryRule`.
- **Money** stored as `Decimal(12,2)` (no float rounding).
- **Migrations** via Prisma; **cascade deletes**; targeted **indexes** (e.g. `[accountId, date]`, category columns).
- **Soft-delete** on transactions (`deletedAt`); `source` distinguishes `PLAID` vs `MANUAL`.

## Transactions & categorization

- **Layered category resolution** (precedence): user override → merchant rule → recurring/subscription heuristic → Plaid personal-finance category.
- **Merchant rules:** recategorizing one transaction can **back-fill every past + future** charge from that merchant (keyed by merchant entity id or name).
- **Manual transactions**, free-form **notes + tags**.
- **Filtering** by date / category / search, with pagination and a signed-amount model.
- **Summary aggregation** excludes internal transfers + card payments so totals reflect real spending.

## Budgets & dashboard

- **Per-category monthly budgets** with spent-vs-limit tracking; copy budgets across periods.
- **Dashboard:** spending / income / net totals, spending-by-category breakdown, spending-over-time chart (Recharts).

## Frontend

- **React 19** + **React Router 7**; `ProtectedRoute` wrapper for authed pages.
- **TanStack Query** for all server state (hooks: `useTransactions`, `useBudgets`, `useItems`) — caching, invalidation, no manual loading spaghetti.
- **AuthContext** for auth state; centralized `src/api/` client.
- **Tailwind CSS 4** (via `@tailwindcss/vite`); **lucide-react** icons; **react-plaid-link** for the Link flow.
- **Vite 7** dev server + build.

## Testing

- **Vitest** unit tests targeting **pure, I/O-free logic**: category resolution, recurring detection, webhook routing/verification.
- Kept deterministic so business rules are tested without a DB.

## Linting / formatting / types

- **ESLint 9** flat config with `typescript-eslint` + `eslint-plugin-react-hooks`.
- **Prettier** for formatting.
- **`tsc` typecheck** across all workspaces.

## CI/CD

- **GitHub Actions** (`.github/workflows/ci.yml`) on push to `main` and every PR: `npm ci` → Prisma generate → **lint → typecheck → test**.
- Uses `pull_request` (fork PRs get read-only token, no secrets) — CI can't deploy.
- **Deploy is gated behind merge to `main`**; Render auto-deploys on that push.

## Deployment & demo mode

- **Render Blueprint** provisions Postgres + Express API + static Vite site; API **health check** at `/api/v1/health`; build step runs migrate + seed.
- **Demo mode** (`DEMO_MODE`, `SEED_DEMO`): pre-verified seeded demo account, **synthetic** transaction data, destructive actions blocked, runs against **Plaid Sandbox**.
