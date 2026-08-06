# API Reference

The HTTP interface exposed by the backend (`apps/api`). Routes are versioned
under `/api/v1` and grouped by feature. This folder documents each feature group
in its own file; shared conventions live here.

## Base URL

| Environment | Base URL                          |
| ----------- | --------------------------------- |
| Development | `http://localhost:3001/api/v1`    |
| Production  | _(set once the demo is deployed)_ |

## Conventions

- **Content type:** JSON request and response bodies.
- **Auth:** a JWT in an HTTP-only cookie named `token` (see [auth.md](./auth.md)).
  Browser clients must send credentials (`fetch(..., { credentials: "include" })`);
  `curl` uses a cookie jar (`-c`/`-b`). Most routes require auth; some also
  require a verified email.
- **Validation:** request bodies are validated with Zod — invalid input returns `400`.
- **Ownership:** every resource is scoped to the authenticated user; requesting
  another user's record returns `404`, not the record.

### Status codes

| Code  | Meaning                                             |
| ----- | --------------------------------------------------- |
| `200` | OK                                                  |
| `201` | Created                                             |
| `400` | Invalid request body / params                       |
| `401` | Not authenticated (missing/invalid cookie)          |
| `403` | Authenticated but not permitted (e.g. email unverified) |
| `404` | Not found (or not owned by the caller)              |
| `409` | Conflict (uniqueness violation)                     |
| `429` | Rate limit exceeded                                 |

### Error format

Non-2xx responses use a consistent shape:

```json
{ "error": "message" }
```

## Endpoints

| Group                            | Description                                        |
| -------------------------------- | -------------------------------------------------- |
| [Auth](./auth.md)                | Register, login, sessions, OAuth, email/password flows |
| [Plaid](./plaid.md)              | Bank connections, token exchange, sync, webhook    |
| [Budgets](./budgets.md)          | Per-category monthly budgets (CRUD + copy)         |
| [Transactions](./transactions.md)| List/filter, summary, categories, manual entries   |
| [Health](./health.md)            | Liveness / DB check                                |

## Postman collection

A ready-to-import collection covering every endpoint lives at
[`postman/Finapse_V1.postman_collection.json`](../../postman/Finapse_V1.postman_collection.json).
Import it via **File → Import**, enable cookie handling, and run **Login** first
so the `token` cookie is sent automatically on later requests.
