# Database

This document describes the database layer.

## Technology

- PostgreSQL 16 (via Docker locally)
- Prisma 7 (ORM + migrations)

## Schema Source of Truth

The schema is defined in `apps/api/prisma/schema.prisma`. Migrations live in `apps/api/prisma/migrations/`.

## Migration Workflow

Run from `apps/api/`:

1. Update `schema.prisma`
2. `npm run db:migrate` — creates and applies a new migration (also regenerates the Prisma client)
3. `npm run prisma:generate` — regenerate the client on its own if needed
4. Update service/API logic as needed

Other commands: `npm run db:deploy` (apply existing migrations, CI/prod), `npm run db:studio` (GUI), and `npm run db:reset` from the repo root (drop volume + recreate).

## Core Models

Defined in `schema.prisma`. Summary of the main entities:

### User

- `id`, `fullName`, `email` (unique), `passwordHash`
- `emailVerified` — Google sign-ups start verified; password sign-ups gate Plaid until verified
- Relations: `plaidItems`, `budgets`, `tokens`, `merchantRules`

### PlaidItem

- One per bank connection. Stores the **encrypted** Plaid `accessToken`, `itemId`, and status (e.g. `ACTIVE`, `NEEDS_REAUTH`).
- Belongs to a `User`; has many `Account`s.

### Account

- A single bank account within a `PlaidItem` (name, mask, type/subtype, balances).
- Has many `Transaction`s.

### Transaction

- Synced (`source = PLAID`) or user-entered (`source = MANUAL`). Signed `amount` (positive = outflow/spend, negative = inflow).
- Plaid fields: `merchantName`, `merchantEntityId`, `personalFinanceCategory` (primary) / `personalFinanceCategoryDetail`, `paymentChannel`, `location`, `pending`.
- User fields: `userCategory` (override), `categorySource` (`null` | `MANUAL` | `MERCHANT_RULE`), `notes`, `tags`.
- Soft-deleted via `deletedAt` (hidden from all queries).

### Budget

- Per-user, per-category monthly budget (`category`, `limitAmount`, `periodStart`). Unique per `(userId, category, periodStart)`.

### MerchantCategoryRule

- Per-user rule auto-assigning a category to all transactions from a merchant.
- `merchantKey` is `entity:<merchantEntityId>` when Plaid provides a stable entity id, else `name:<lowercased merchant label>`. Unique per `(userId, merchantKey)`.
- Applied at recategorization time (back-fill) and on every sync (new rows), by writing `userCategory` + `categorySource = MERCHANT_RULE` on matching rows.

### Token

- Short-lived tokens for email verification and password reset.

## Design Principles

- Keep the schema normalized but pragmatic; index where queries need it (e.g. `Transaction` by account/date, category, `userCategory`).
- Never store secrets in plaintext — Plaid access tokens are encrypted at rest.
- Prefer additive, reversible migrations.

## Seeding

A seed script scaffold exists at `apps/api/prisma/seed.ts`.

Run:

```bash
npm run db:seed        # from apps/api/
npm run db:seed:dev    # with NODE_ENV=development
```

This document should reflect the actual schema as it evolves.
