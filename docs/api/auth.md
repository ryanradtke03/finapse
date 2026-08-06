# Auth

Registration, login, session management, Google OAuth, and email-verification /
password-reset flows. All routes are mounted under `/api/v1/auth`.

Sessions use a JWT stored in an **HTTP-only cookie** named `token`. Login and the
Google callback set it; logout and account deletion clear it. Credential and
email endpoints are rate-limited; several are disabled in demo mode.

**Public user object** (returned by most auth endpoints)

| Field           | Type                      | Notes                          |
| --------------- | ------------------------- | ------------------------------ |
| `id`            | string (uuid)             |                                |
| `email`         | string                    |                                |
| `fullName`      | string                    |                                |
| `hasPassword`   | boolean                   | `false` for Google-only accounts |
| `emailVerified` | boolean                   |                                |
| `provider`      | `"password"` \| `"google"`|                                |

---

## `POST /auth/register`

Create a password account. Sends a verification email (best-effort).

**Auth:** None · disabled in demo mode

**Request body**

| Field      | Type   | Required | Notes            |
| ---------- | ------ | -------- | ---------------- |
| `email`    | string | yes      | Valid email      |
| `password` | string | yes      | Min length 8     |
| `fullName` | string | yes      | Min length 1     |

**Response** `201 Created`

```json
{ "user": { "id": "u_1", "email": "you@example.com", "fullName": "You", "createdAt": "2026-08-05T04:00:00.000Z", "hasPassword": true, "emailVerified": false, "provider": "password" } }
```

**Errors**

| Status | When                    |
| ------ | ----------------------- |
| `400`  | Invalid body            |
| `409`  | Email already in use    |
| `429`  | Too many attempts       |

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"supersecret","fullName":"You"}'
```

---

## `POST /auth/login`

Authenticate with email + password. Sets the `token` cookie on success.

**Auth:** None

**Request body**

| Field      | Type   | Required |
| ---------- | ------ | -------- |
| `email`    | string | yes      |
| `password` | string | yes      |

**Response** `200 OK` — sets `Set-Cookie: token=<jwt>; HttpOnly`

```json
{ "user": { "id": "u_1", "email": "demo@finapse.com", "fullName": "Demo User", "hasPassword": true, "emailVerified": true, "provider": "password" } }
```

**Errors**

| Status | When                                              |
| ------ | ------------------------------------------------- |
| `400`  | Invalid body                                      |
| `401`  | Invalid credentials *(kept generic — no enumeration)* |
| `429`  | Too many failed attempts                          |

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@finapse.com","password":"demo1234"}' -c cookies.txt
```

---

## `GET /auth/me`

Return the current authenticated user.

**Auth:** Required

**Response** `200 OK` → `{ "user": { ...public user } }`

**Errors:** `401` if not authenticated.

```bash
curl http://localhost:3001/api/v1/auth/me -b cookies.txt
```

---

## `PUT /auth/me`

Update the current user's profile.

**Auth:** Required · disabled in demo mode

**Request body**

| Field      | Type   | Required | Notes            |
| ---------- | ------ | -------- | ---------------- |
| `fullName` | string | yes      | 1–100 chars      |

**Response** `200 OK` → `{ "user": { ...public user } }`

**Errors:** `400` invalid body · `401` not authenticated.

---

## `PUT /auth/password`

Change the password for a password account.

**Auth:** Required · disabled in demo mode · rate-limited

**Request body**

| Field             | Type   | Required | Notes        |
| ----------------- | ------ | -------- | ------------ |
| `currentPassword` | string | yes      |              |
| `newPassword`     | string | yes      | Min length 8 |

**Response** `200 OK` → `{ "message": "Password updated" }`

**Errors:** `400` invalid body · `401` wrong current password / not authenticated.

---

## `POST /auth/logout`

Clear the session cookie.

**Auth:** None (no-op if not logged in)

**Response** `204 No Content`

```bash
curl -X POST http://localhost:3001/api/v1/auth/logout -b cookies.txt
```

---

## `DELETE /auth/me`

Delete the current user's account and all associated data; clears the cookie.

**Auth:** Required · disabled in demo mode

**Response** `204 No Content`

**Errors:** `401` if not authenticated.

---

## `POST /auth/verify-email`

Verify an email using the token from the verification link.

**Auth:** None · rate-limited

**Request body:** `{ "token": "<verify-token>" }`

**Response** `200 OK` → `{ "message": "Email verified" }`

**Errors:** `400` invalid/expired token.

---

## `POST /auth/resend-verification`

Re-send the verification email to the current user.

**Auth:** Required · rate-limited (email limiter)

**Response** `200 OK` → `{ "sent": true }`

---

## `POST /auth/forgot-password`

Request a password-reset email. Always returns the same response whether or not
the email exists (anti-enumeration).

**Auth:** None · disabled in demo mode · rate-limited

**Request body:** `{ "email": "you@example.com" }`

**Response** `200 OK`

```json
{ "message": "If an account exists for that email, a reset link has been sent." }
```

---

## `POST /auth/reset-password`

Set a new password using a reset token.

**Auth:** None · disabled in demo mode · rate-limited

**Request body**

| Field         | Type   | Required | Notes        |
| ------------- | ------ | -------- | ------------ |
| `token`       | string | yes      | From the reset link |
| `newPassword` | string | yes      | Min length 8 |

**Response** `200 OK` → `{ "message": "Password updated" }`

**Errors:** `400` invalid/expired token or body.

---

## `GET /auth/google`

Begin the Google OAuth flow (redirects to Google).

**Auth:** None · disabled in demo mode

**Response** `302` redirect to Google's consent screen.

---

## `GET /auth/google/callback`

OAuth callback. On success, sets the `token` cookie and redirects to the
frontend `/dashboard`; on failure, redirects to the frontend with an
`?authError=` reason (e.g. `account_exists`, `google_failed`).

**Auth:** None · disabled in demo mode

**Response** `302` redirect to the frontend.
