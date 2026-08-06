# Contributing

Guidelines for working in this repository.

## Setup

See [Local Development](./DEVELOPMENT.md) for env files and the exact commands.
The short version, from the repo root:

```bash
npm install
npm run dev      # Postgres + API + web together
```

## Branching Strategy

- One feature per branch
- Branch name format:
  - `FIN-<number>-short-description`

Example: FIN-108-split-plaid-env-config

## Pull Requests

- Keep PRs small
- Reference Linear issue
- Ensure:
  - Backend runs
  - Frontend runs
  - No type errors
  - Lint passes (if configured)

## Commit Message Style

Examples:
feat(api): add merchant category rules
feat(web): add transactions list total
chore(docs): update architecture section
fix(api): correct spending aggregation

## Documentation Rule

If you introduce:
- A new/changed endpoint → update the matching file in [`docs/api/`](./api/) (`auth.md`, `plaid.md`, `budgets.md`, `transactions.md`, `health.md`)
- A schema change → update `db.md`
- An auth/session change → update `auth.md`
- A structural decision → update `architecture.md`