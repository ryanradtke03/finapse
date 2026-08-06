# Plaid

Bank connections via [Plaid](https://plaid.com): creating a Link token,
exchanging a public token, syncing transactions, and receiving Plaid webhooks.
All routes are mounted under `/api/v1/plaid`.

A connection is stored as a `PlaidItem` (encrypted access token) with one or more
`Account`s. Connecting and exchanging tokens **require a verified email**; the
webhook endpoint is public and authenticated by Plaid's signature instead.

---

## `POST /plaid/create-link-token`

Create a short-lived Plaid Link token to initialize Link on the frontend.

**Auth:** Required · verified email required

**Request body**

| Field            | Type   | Required | Notes                                  |
| ---------------- | ------ | -------- | -------------------------------------- |
| `institution_id` | string | no       | Present for reconnect / update mode    |

**Response** `200 OK`

```json
{ "link_token": "link-sandbox-abc123", "mode": "new" }
```

```bash
curl -X POST http://localhost:3001/api/v1/plaid/create-link-token \
  -H "Content-Type: application/json" -d '{}' -b cookies.txt
```

---

## `POST /plaid/exchange-token`

Exchange the public token from Link for an access token, persist the item, and
kick off the initial transaction sync in the background.

**Auth:** Required · verified email required

**Request body**

| Field                | Type   | Required | Notes                          |
| -------------------- | ------ | -------- | ------------------------------ |
| `public_token`       | string | yes      | From Plaid Link `onSuccess`    |
| `institution`        | object | yes      | Must include `institution.id`  |

```json
{ "public_token": "public-sandbox-abc", "institution": { "id": "ins_1", "name": "First Platypus Bank" } }
```

**Response** `200 OK` → `{ "success": true }`

**Errors:** `400` missing `public_token` or `institution.id`.

---

## `POST /plaid/sync/:itemId`

Run an incremental (`cursor`-based) transaction sync for one item. Returns the
delta counts.

**Auth:** Required

**Response** `200 OK`

```json
{ "added": 12, "modified": 2, "removed": 0 }
```

**Errors:** `404` if the item isn't found or isn't owned by the caller.

```bash
curl -X POST http://localhost:3001/api/v1/plaid/sync/item_123 -b cookies.txt
```

---

## `POST /plaid/backfill/:itemId`

Force a **full** re-sync of an item's history (re-fetches everything, ignoring
the stored cursor) to repopulate fields added after the first sync.

**Auth:** Required

**Response** `200 OK` → same `{ added, modified, removed }` shape.

**Errors:** `404` if not found / not owned.

---

## `POST /plaid/update-webhooks`

Register the configured webhook URL on the caller's already-connected items
(backfills items linked before the URL was set). Returns a per-item report.

**Auth:** Required

**Response** `200 OK`

```json
{ "results": [ { "itemId": "item_123", "ok": true } ] }
```

---

## `POST /plaid/webhook`

Receiver for Plaid webhooks. **Not** cookie-authenticated — trust comes from
verifying Plaid's `Plaid-Verification` ES256 JWT over the raw request body.
Acknowledges fast and does any sync work out of band.

**Auth:** None (Plaid signature verified)

**Headers:** `Plaid-Verification: <jwt>`

**Response**

| Status | Body                    | When                                    |
| ------ | ----------------------- | --------------------------------------- |
| `200`  | `{ "received": true }`  | Accepted (acted on or safely ignored)   |
| `401`  | `{ "error": "Invalid webhook signature" }` | Signature/freshness/body-hash check failed |

---

## `GET /plaid/item`

List the caller's connected items, each with its accounts and institution logo.

**Auth:** Required

**Response** `200 OK`

```json
[
  {
    "id": "item_123",
    "institutionId": "ins_1",
    "institutionName": "First Platypus Bank",
    "status": "ACTIVE",
    "updatedAt": "2026-08-05T04:00:00.000Z",
    "institutionLogo": "data:image/png;base64,...",
    "accounts": [
      { "id": "a_1", "name": "Checking", "mask": "3333", "type": "depository", "subtype": "checking", "balanceCurrent": "1240.55", "isoCurrencyCode": "USD" }
    ]
  }
]
```

`status` is one of `ACTIVE`, `NEEDS_REAUTH`, `DISCONNECTED`.

```bash
curl http://localhost:3001/api/v1/plaid/item -b cookies.txt
```

---

## `DELETE /plaid/item/:id`

Remove a bank connection (and its accounts + transactions).

**Auth:** Required

**Response** `200 OK` → `{ "message": "Bank removed successfully" }`

**Errors:** `404` if not found / not owned.

---

## `DELETE /plaid/account/:id`

Remove a single account from a connection.

**Auth:** Required

**Response** `200 OK` → `{ "message": "Account removed successfully" }`

**Errors:** `404` if not found / not owned.
