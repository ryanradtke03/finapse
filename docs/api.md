# API

The HTTP interface exposed by the backend (`apps/api`). All routes are mounted under a versioned/base path and grouped by feature.

## Base URL

- Development: `http://localhost:3001`
- Production: (to be defined — see FIN-112 for a hosted demo)

## Conventions

- JSON request and response bodies.
- Standard HTTP status codes.
- Auth via a JWT in an HTTP-only cookie named `token` (see [auth.md](./auth.md)). Requests must send the cookie (`credentials: "include"`).
- Most routes require authentication; some also require a verified email.
- Validation uses Zod; invalid bodies return `400`.

### Error format

Non-2xx responses use:

```json
{ "error": "message" }
```

## Health

### `GET /health`
Liveness check. → `{ "ok": true }`

## Auth (`/auth`)

Implemented — see [auth.md](./auth.md) for full detail. Includes registration, login, logout, current user, Google OAuth, email verification, and password reset.

## Plaid (`/plaid`)

All require auth unless noted; link/exchange also require a verified email.

- `POST /plaid/create-link-token` — create a Plaid Link token to open Link on the client.
- `POST /plaid/exchange-token` — exchange a `public_token` for an access token; stores an encrypted `PlaidItem`.
- `POST /plaid/sync/:itemId` — sync accounts/transactions for an item.
- `POST /plaid/backfill/:itemId` — repopulate newer fields on already-synced transactions.
- `POST /plaid/webhook` — **no auth**; called by Plaid directly. Trust is established via signature verification.
- `GET /plaid/item` — list the user's connected items/accounts.
- `DELETE /plaid/item/:id` — remove a bank connection.
- `DELETE /plaid/account/:id` — remove a single account.

## Transactions (`/transaction`)

All require auth.

### `GET /transaction`
List transactions (paginated, cursor-based). Query params: `accountId`, `startDate`, `endDate`, `search`, `category` (repeatable), `limit`, `cursor`.

Response:

```json
{
  "transactions": [ /* … */ ],
  "nextCursor": "…|null",
  "totalAmount": 0,
  "totalCount": 0
}
```

`totalAmount` (signed net; positive = net outflow) and `totalCount` cover the **entire filtered set**, not just the returned page, so the UI can show a running total that respects the active filters.

### `POST /transaction`
Create a manual transaction. Body: `accountId`, `amount` (signed: positive = expense, negative = income), `date`, `name`, `category`, optional `notes`, `tags`.

### `GET /transaction/summary`
Aggregates for the dashboard. Query params: `startDate`, `endDate`, `accountId`, `category` (repeatable).

Response:

```json
{
  "summary": {
    "byCategory": [{ "category": "…", "total": 0, "count": 0 }],
    "byDay": [{ "date": "YYYY-MM-DD", "spending": 0, "income": 0 }],
    "totalSpent": 0,
    "totalIncome": 0
  }
}
```

By default (no explicit category filter) the summary **excludes** internal transfers (`TRANSFER_IN`, `TRANSFER_OUT`) and credit-card payments, so totals reflect real spending rather than money moved between the user's own accounts. Explicitly selecting one of those categories still returns it.

### `GET /transaction/categories`
Distinct categories present in the user's data (for the filter dropdown).

### `GET /transaction/:id`
Fetch a single transaction.

### `PATCH /transaction/:id`
Update a transaction. Body (all optional, at least one required):

- `category` — sets the user override (`userCategory`); `null` clears it.
- `notes`, `tags`
- `applyToMerchant` — `"future"` or `"all"`. When set with a non-null `category`, also creates/updates a **merchant category rule**. `"all"` back-fills existing transactions from the same merchant; both apply to future synced rows. Manual per-row overrides are never overwritten.

### `DELETE /transaction/:id`
Soft-delete. Only `source = MANUAL` transactions may be deleted (synced rows would return on the next sync).

## Budgets (`/budget`)

Per-user, per-category monthly budgets with spent-vs-limit tracking. (See the budget feature module for the current endpoint set.)
