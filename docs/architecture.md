# Architecture

This document describes the overall system structure and how components interact.

## Monorepo Structure

```
finapse/
├── apps/
│   ├── api/        # Backend API (Node + Express + TypeScript + Prisma)
│   └── web/        # Frontend (React + Vite + TypeScript)
├── packages/
│   └── types/      # Shared TypeScript types
├── docs/
└── package.json    # npm workspaces
```

## High-Level Overview

Standard client–server architecture with a third-party banking integration:

- **Web App (React + Vite)** — UI, user interaction, auth state (via `AuthContext`), and API calls (centralized in `src/api/`). Data fetching/caching uses TanStack Query. Protected routes use a `ProtectedRoute` wrapper.

- **API (Node + Express + Prisma)** — request validation (Zod), business logic, database access, authentication, and the Plaid integration. Organized by feature under `src/features/` (auth, plaid, transaction, budget, health), each with a route, controller, and service.

- **Database (PostgreSQL + Prisma)** — stores users, bank connections (`PlaidItem`), accounts, transactions, budgets, merchant category rules, and auth tokens.

- **Plaid** — external provider for bank connections. Access tokens are encrypted at rest (AES-256-GCM) and never leave the backend.

## Request Flow

```
Web UI → API route → controller (validate) → service (business logic) → Prisma → PostgreSQL
```

The controller layer parses/validates input (Zod) and shapes responses; services hold business logic and own all DB access.

## Plaid Sync Flow

1. Frontend opens Plaid Link and obtains a `public_token`.
2. Backend exchanges it for an `access_token`, encrypts it, and stores a `PlaidItem`.
3. Sync (manual or via the signed webhook) pulls accounts and transactions and upserts `Account` / `Transaction` rows.
4. After each sync, the user's merchant category rules are applied to newly synced rows.

The Plaid environment (`sandbox` vs `production`) is selected by `PLAID_ENV`, which maps to the correct Plaid base URL and per-environment secret. See the [root README](../README.md) and `apps/api/.env.example`.

## Notable Domain Logic

- **Effective category** — a transaction's category resolves as: user override → recurring/subscription heuristic → Plaid detailed category → Plaid primary category. Mirrored on the front end for display.
- **Merchant category rules** — recategorizing a transaction can create a rule (keyed on Plaid `merchantEntityId`, else `merchantName`/`name`) that applies the category to all of that merchant's transactions, back-filling existing rows and auto-applying on future syncs. Manual per-row overrides are never overwritten.
- **Spending accuracy** — dashboard spending/income totals exclude internal transfers (`TRANSFER_IN`, `TRANSFER_OUT`) and credit-card payments so money moved between a user's own accounts (and card payments already counted on the card) doesn't inflate spending.

## Design Decisions

- **REST over GraphQL** for simplicity and clarity.
- **Prisma ORM** for type safety and migrations.
- **Monorepo (npm workspaces)** to coordinate frontend, backend, and shared types.
- **Feature-based backend structure** (`src/features/*`) over layer-based, keeping each domain cohesive.
- **Environment-based config** for dev/prod and Plaid sandbox/production separation.

This document should evolve as the architecture grows.
