# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands are run from the repo root unless noted.

```bash
# Development
npm run dev:api          # Start API with hot reload (ts-node-dev)
cd apps/web && npm run dev  # Start Vite frontend dev server

# Database
npm run db:up            # Start PostgreSQL via Docker
npm run db:down          # Stop PostgreSQL
npm run db:reset         # Drop DB, remove volume, recreate

# Prisma (run from apps/api/)
npm run db:migrate       # Create and apply a new migration
npm run db:deploy        # Apply existing migrations (CI/prod)
npm run db:studio        # Open Prisma Studio GUI
npm run prisma:generate  # Regenerate Prisma client after schema changes

# Quality
npm run lint             # ESLint across all packages
npm run format           # Prettier formatting
npm run typecheck        # TypeScript checks across all packages
npm run test             # Run tests across all packages
```

## Architecture

**Monorepo** using npm workspaces. Two apps: `apps/api` (Node/Express) and `apps/web` (React + Vite). No shared packages directory currently populated.

### Backend (`apps/api`)

Feature-based structure under `src/features/` — each feature (auth, health, plaid) has a controller, service, and route. There is a separate top-level `src/services/` directory that partially duplicates this logic; prefer the `features/` pattern for new work.

Key layers:
- **Routes** → **Controllers** → **Services** (business logic) → **Prisma** (DB)
- Validation via Zod schemas in `src/schemas/`
- Auth: JWT in HTTP-only cookies + Google OAuth via Passport (`src/auth/`)
- Middleware: `src/middleware/` handles auth guard, error handling, 404

### Frontend (`apps/web`)

React 19 + React Router v7. Auth state managed via `AuthContext` (`src/context/`). API calls centralized in `src/api/`. Protected routes use the `ProtectedRoute` wrapper component.

### Database

PostgreSQL 16 via Docker (`docker-compose.yml`). Prisma ORM — schema at `apps/api/prisma/schema.prisma`. Key models: User, PlaidItem (bank connection with encrypted access token), Account, Transaction, Budget.

### Authentication

- Email/password: bcrypt + JWT cookie
- Google OAuth: Passport strategy, redirects back to frontend with cookie set
- Protected API routes use auth middleware that validates the JWT cookie

### Plaid Integration

Bank connections stored as `PlaidItem` records. Access tokens are encrypted at rest. The flow: frontend opens Plaid Link → exchanges public token → backend stores access token → syncs accounts/transactions.

### Environment

Each app has its own `.env` file. See `.env.example` at root for required variables: `DATABASE_URL`, `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, Plaid API credentials, Google OAuth credentials.
