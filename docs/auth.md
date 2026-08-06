# Authentication

How auth works in Finapse — the session model, cookie/JWT config, providers, and
the email-verification / password-reset design.

> **Endpoint reference:** the request/response details for each auth route live
> in [`docs/api/auth.md`](./api/auth.md). This doc covers the *design*; that one
> covers the *contract*.

## Session model

- Auth is **stateless JWT** carried in an HTTP-only cookie named `token` — there
  is no server-side session store.
- Login and the Google OAuth callback sign a JWT and set the cookie; logout and
  account deletion clear it.
- `requireAuth` middleware reads `req.cookies.token`, verifies it with
  `JWT_SECRET`, and populates `req.user` from the claims (`sub` → user id,
  `email`, `fullName`).
- Object-level authorization is enforced in the service layer: every resource
  lookup is scoped to `req.user.id`, so a valid token can't reach another user's
  data (requests for someone else's record return `404`).

## Cookie configuration

Set by `apps/api/src/features/auth/auth.cookies.ts`:

| Option     | Value                                                    |
| ---------- | -------------------------------------------------------- |
| `name`     | `token`                                                  |
| `httpOnly` | `true` (JS can't read it — mitigates XSS token theft)    |
| `secure`   | `true` in production, `false` in dev                     |
| `sameSite` | `none` in production (cross-site API), `lax` in dev      |
| `path`     | `/`                                                      |

Because production uses `SameSite=None`, the cookie requires `Secure` (HTTPS) —
which is why `NODE_ENV=production` is required on deploys.

## JWT configuration

- `JWT_SECRET` (required) — signing secret.
- `JWT_EXPIRES_IN` (default `7d`) — token lifetime.
- Claims: `sub` (user id), `email`, `fullName`.

## Providers

- **Password** — bcrypt hashing (cost 12). Registration creates an *unverified*
  account and sends a verification email.
- **Google OAuth** — Passport (`passport-google-oauth20`). Google sign-ups are
  created pre-verified. A custom callback turns verify-step failures into a
  friendly frontend redirect (`?authError=account_exists|google_failed`) rather
  than a broken redirect on the API host.

`User.provider` is derived: an empty `passwordHash` means a Google-only account
(`"google"`), otherwise `"password"`.

## Email verification & password reset

- Both use short-lived, single-use tokens stored in the `Token` table.
- Only a **SHA-256 hash** of the token is persisted, so a DB leak can't hand out
  working links.
- Password sign-ups are gated: connecting a bank (Plaid) requires a verified
  email (`requireVerifiedEmail` middleware). Google sign-ups skip this since
  they're verified on creation.
- `forgot-password` always returns the same response whether or not the email
  exists (anti-enumeration).

## Client integration

- Browser clients must send credentials on cross-origin requests
  (`fetch(..., { credentials: "include" })`).
- CORS is configured with an origin allowlist and `credentials: true`.
- See [`docs/api/auth.md`](./api/auth.md) for the per-endpoint contract and
  [`docs/architecture.md`](./architecture.md) for where auth sits in the request
  flow.
