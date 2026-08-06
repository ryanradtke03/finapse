# Budgets

Per-category monthly budgets. A budget ties a spending `limit` to a `category`
for a given month (`periodStart`). One budget is allowed per
`(category, periodStart)` per user.

All routes are mounted under `/api/v1/budget` and **require authentication**.

**Budget object**

| Field         | Type              | Notes                                  |
| ------------- | ----------------- | -------------------------------------- |
| `id`          | string (uuid)     |                                        |
| `category`    | string            |                                        |
| `limitAmount` | string (decimal)  | Serialized as a string, e.g. `"850.00"`|
| `periodStart` | string (ISO date) | First day of the budget month          |
| `userId`      | string (uuid)     |                                        |
| `createdAt`   | string (ISO)      |                                        |
| `updatedAt`   | string (ISO)      |                                        |

---

## `POST /budget`

Create a budget for a category and month.

**Request body**

| Field         | Type   | Required | Notes                              |
| ------------- | ------ | -------- | ---------------------------------- |
| `category`    | string | yes      | Min length 1                       |
| `limitAmount` | string | yes      | Decimal amount, e.g. `"850.00"`    |
| `periodStart` | string | yes      | First day of the month (ISO date)  |

```json
{ "category": "Food & Drink", "limitAmount": "850.00", "periodStart": "2026-08-01" }
```

**Response** `201 Created` — the created budget object.

```json
{
  "id": "b_9",
  "category": "Food & Drink",
  "limitAmount": "850.00",
  "periodStart": "2026-08-01T00:00:00.000Z",
  "userId": "u_1",
  "createdAt": "2026-08-05T04:15:00.000Z",
  "updatedAt": "2026-08-05T04:15:00.000Z"
}
```

**Errors**

| Status | When                                                     |
| ------ | -------------------------------------------------------- |
| `400`  | Invalid body                                             |
| `409`  | A budget for this category + month already exists        |

```bash
curl -X POST http://localhost:3001/api/v1/budget \
  -H "Content-Type: application/json" \
  -d '{"category":"Food & Drink","limitAmount":"850.00","periodStart":"2026-08-01"}' \
  -b cookies.txt
```

---

## `GET /budget`

List the caller's budgets, optionally filtered to a single month.

**Query parameters**

| Param         | Type              | Required | Notes                                  |
| ------------- | ----------------- | -------- | -------------------------------------- |
| `periodStart` | string (ISO date) | no       | Return only budgets for this month     |

**Response** `200 OK` — an array of budget objects.

```json
[
  {
    "id": "b_9",
    "category": "Food & Drink",
    "limitAmount": "850.00",
    "periodStart": "2026-08-01T00:00:00.000Z",
    "userId": "u_1",
    "createdAt": "2026-08-05T04:15:00.000Z",
    "updatedAt": "2026-08-05T04:15:00.000Z"
  }
]
```

```bash
curl "http://localhost:3001/api/v1/budget?periodStart=2026-08-01" -b cookies.txt
```

---

## `GET /budget/:id`

Fetch a single budget by id.

**Response** `200 OK` — the budget object.

**Errors**

| Status | When                                     |
| ------ | ---------------------------------------- |
| `404`  | Not found, or not owned by the caller    |

---

## `PUT /budget/:id`

Update a budget. All fields are optional (partial update).

**Request body**

| Field         | Type   | Required | Notes                           |
| ------------- | ------ | -------- | ------------------------------- |
| `category`    | string | no       |                                 |
| `limitAmount` | string | no       | Decimal amount                  |
| `periodStart` | string | no       | ISO date                        |

```json
{ "limitAmount": "900.00" }
```

**Response** `200 OK` — the updated budget object.

**Errors**

| Status | When                                  |
| ------ | ------------------------------------- |
| `400`  | Invalid body                          |
| `404`  | Not found, or not owned by the caller |

---

## `DELETE /budget/:id`

Delete a budget.

**Response** `200 OK` — empty body.

**Errors**

| Status | When                                  |
| ------ | ------------------------------------- |
| `404`  | Not found, or not owned by the caller |

```bash
curl -X DELETE http://localhost:3001/api/v1/budget/b_9 -b cookies.txt
```

---

## `POST /budget/copy`

Copy every budget from one month into another. Categories already budgeted in
the target month are skipped, so it's safe to re-run.

**Request body**

| Field  | Type              | Required | Notes                        |
| ------ | ----------------- | -------- | ---------------------------- |
| `from` | string (ISO date) | yes      | Source month (`periodStart`) |
| `to`   | string (ISO date) | yes      | Target month (`periodStart`) |

```json
{ "from": "2026-07-01", "to": "2026-08-01" }
```

**Response** `200 OK` — count of budgets copied.

```json
{ "copied": 6 }
```

**Errors**

| Status | When         |
| ------ | ------------ |
| `400`  | Invalid body |
