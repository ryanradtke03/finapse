# Health

Liveness / readiness check, mounted at `/api/v1/health`. Used by the deploy
platform's health check.

---

## `GET /health`

Verify the API is up and can reach the database (runs `SELECT 1`).

**Auth:** None

**Response**

| Status | Body                          | When                     |
| ------ | ----------------------------- | ------------------------ |
| `200`  | `{ "ok": true, "db": "ok" }`  | API up, DB reachable     |
| `500`  | `{ "ok": false, "db": "down" }` | DB check failed        |

```bash
curl http://localhost:3001/api/v1/health
```
