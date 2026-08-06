# Documentation

High-level documentation for **Finapse**, a personal finance dashboard that connects to bank accounts via Plaid, syncs transactions, and surfaces spending insights and budgets.

These docs explain architecture, API contracts, and development practices so they evolve alongside features. For setup and a project overview, see the [root README](../README.md).

## Contents

**Reference**

- [Architecture](./architecture.md) — system structure, request flow, domain logic
- [API reference](./api/README.md) — per-feature endpoint contracts (`auth`, `plaid`, `budgets`, `transactions`, `health`)
- [Authentication](./auth.md) — session model, cookies, JWT, providers
- [Database](./db.md) — schema, models, migrations
- [Web App](./web.md) — frontend structure and conventions
- [Tech overview](./tech-overview.md) — one-page map of the whole stack

**Working in the repo**

- [Local Development](./DEVELOPMENT.md) — running the stack, env files, modes
- [Demo Mode](./DEMO_MODE.md) — public Sandbox demo posture and deploy
- [Testing](./testing.md) — unit tests and Plaid Sandbox test data
- [Contributing](./contributing.md) — branching, PRs, doc rules

## Philosophy

Documentation should:

- Explain *why* decisions were made
- Clarify system boundaries
- Prevent knowledge loss
- Stay lightweight and practical

When adding major features, update the relevant doc.
