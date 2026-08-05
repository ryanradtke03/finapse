# Contributing

Guidelines for working in this repository.

## Setup

1. Install dependencies at root
2. Start backend
3. Start frontend

(Exact commands should be defined in root README.)

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
- A new endpoint → update `api.md`
- A schema change → update `db.md`
- A structural decision → update `architecture.md`