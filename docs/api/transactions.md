# Transactions

Browse, filter, summarize, and annotate transactions, plus manual entries.
All routes are mounted under `/api/v1/transaction` and **require authentication**.

`amount` is **signed**: positive = spending (outflow), negative = income
(inflow). Summary totals reflect the entire filtered set, and Dashboard/summary
math excludes internal transfers and card payments.

---

## `GET /transaction`

Filtered, paginated list of the caller's transactions, plus totals for the whole
filtered set.

**Query parameters**

| Param                 | Type              | Default | Notes                              |
| --------------------- | ----------------- | ------- | ---------------------------------- |
| `accountId`           | string \| string[]| —       | One or more accounts               |
| `startDate` / `endDate` | string (ISO date) | —     | Inclusive date range               |
| `search`              | string            | —       | Case-insensitive name / merchant   |
| `category`            | string \| string[]| —       | One or more categories             |
| `limit`               | number            | `20`    | Page size, hard cap `100`          |
| `cursor`              | string            | —       | Cursor from a prior response       |

**Response** `200 OK`

```json
{
  "transactions": [
    { "id": "t_1", "date": "2026-08-05T00:00:00.000Z", "name": "Netflix", "merchantName": "Netflix", "amount": "15.49", "category": "Subscription", "accountId": "a_1", "pending": false }
  ],
  "nextCursor": "t_1",
  "totalAmount": 3473.01,
  "totalCount": 233
}
```

```bash
curl "http://localhost:3001/api/v1/transaction?search=netflix&limit=25" -b cookies.txt
```

---

## `POST /transaction`

Create a manual transaction (`source = MANUAL`).

**Request body**

| Field       | Type     | Required | Notes                                          |
| ----------- | -------- | -------- | ---------------------------------------------- |
| `accountId` | string   | yes      | Account to attach to                           |
| `amount`    | number   | yes      | Signed, non-zero (positive = expense)          |
| `date`      | string   | yes      | Parseable date                                 |
| `name`      | string   | yes      | Description                                    |
| `category`  | string   | yes      |                                                |
| `notes`     | string   | no       | Nullable                                       |
| `tags`      | string[] | no       |                                                |

```json
{ "accountId": "a_1", "amount": 42.5, "date": "2026-08-05", "name": "Farmers Market", "category": "Groceries" }
```

**Response** `201 Created` → `{ "transaction": { ... } }`

**Errors:** `400` invalid body (first field error is surfaced as the message).

---

## `GET /transaction/summary`

Aggregated spending/income for the dashboard.

**Query parameters:** `startDate`, `endDate`, `accountId` (multi), `category` (multi).

**Response** `200 OK`

```json
{
  "summary": {
    "byCategory": [ { "category": "Subscription", "total": 1937.0 } ],
    "byDay": [ { "date": "2026-08-01", "spending": 120.0, "income": 0 } ],
    "totalSpent": 3473.01,
    "totalIncome": 4800.0
  }
}
```

```bash
curl "http://localhost:3001/api/v1/transaction/summary?startDate=2026-08-01&endDate=2026-08-31" -b cookies.txt
```

---

## `GET /transaction/categories`

Distinct categories present in the caller's transactions (for filter menus).

**Response** `200 OK` → `{ "categories": ["Subscription", "Groceries", "Dining", ...] }`

---

## `GET /transaction/:id`

Fetch a single transaction, including a resolved `isRecurring` flag.

**Response** `200 OK` → `{ "transaction": { ... } }`

**Errors:** `404` if not found / not owned.

---

## `PATCH /transaction/:id`

Update the user category, notes, or tags. Optionally create a merchant rule.

**Request body** (at least one field required)

| Field             | Type            | Notes                                                        |
| ----------------- | --------------- | ------------------------------------------------------------ |
| `category`        | string \| null  | Sets the user override; `null` clears it                     |
| `notes`           | string \| null  |                                                              |
| `tags`            | string[]        |                                                              |
| `applyToMerchant` | `"future"` \| `"all"` | Also create a merchant rule; `"all"` back-fills existing rows |

```json
{ "category": "Dining", "applyToMerchant": "all" }
```

**Response** `200 OK` → `{ "transaction": { ... } }`

**Errors:** `400` empty/invalid body · `404` not found / not owned.

---

## `DELETE /transaction/:id`

Delete a transaction. Only `MANUAL` transactions can be deleted — a synced row
would just reappear on the next Plaid sync.

**Response** `204 No Content`

**Errors:** `404` not found / not owned · `400`/`409` if the row is Plaid-sourced.

```bash
curl -X DELETE http://localhost:3001/api/v1/transaction/t_1 -b cookies.txt
```
