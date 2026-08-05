# Web Application

This document describes the frontend application located in `apps/web`.

## Tech Stack

- React 19
- Vite 7
- React Router 7
- TanStack Query (server state / caching)
- Tailwind CSS 4
- TypeScript

## Responsibilities

- Rendering UI and managing local component state
- Managing authentication state via `AuthContext` (`src/context/`)
- Calling backend API endpoints (centralized in `src/api/`)
- Handling loading and error states
- Protecting routes via the `ProtectedRoute` wrapper

## Project Structure

```
apps/web/src/
├── api/         # API client modules (auth, plaid, transactions, budgets)
├── components/  # UI components (e.g. TransactionDetailPanel, ConnectBankButton)
├── context/     # AuthContext
├── hooks/       # data hooks (useTransactions, useItems, …) over TanStack Query
├── lib/         # helpers (category resolution, formatting)
├── pages/       # route-level views (Dashboard, Transactions, Budgets, …)
└── main.tsx
```

## API Communication

All API calls are centralized in the `api/` layer to keep components clean, standardize error handling, and simplify refactors. Requests use `fetch` with `credentials: "include"` so the auth cookie is sent. The base URL comes from `VITE_API_URL`.

Example pattern:

```ts
export const getTransactions = async (
  filters: TransactionFilters = {},
): Promise<TransactionsResponse> => {
  const res = await fetch(`${apiBaseUrl}/transaction?${params}`, {
    credentials: "include",
  });
  if (!res.ok) throw await res.json();
  return res.json();
};
```

Data hooks in `hooks/` wrap these with TanStack Query for caching, pagination (`useInfiniteTransactions`), and cache invalidation after writes.

## Key Screens

- **Dashboard** — spending/income/net totals, category breakdown, and spending-over-time chart (transfers and card payments excluded from totals).
- **Transactions** — searchable, filterable, paginated list with a running total for the filtered set; a detail panel for recategorizing (with the optional "apply to all from this merchant" rule), notes, and tags.
- **Budgets** — per-category monthly budgets with spent-vs-limit.
- **Accounts** — connected banks and the Plaid Link flow.

## Notes

- Category display mirrors the backend's effective-category resolution (see `lib/transactionCategories.ts` and `docs/architecture.md`).
- Environment: `apps/web/.env` needs `VITE_API_URL` (defaults to `http://localhost:3001`).
