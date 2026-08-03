import crypto from "crypto";
import jwt, { type JwtHeader } from "jsonwebtoken";
import { plaidClient } from "../../lib/plaidClient";

// How each webhook maps to an action. Kept pure (no I/O) so it's unit-testable
// and the handler stays a thin switch.
export type WebhookAction = "sync" | "reauth" | "ignore";

// Decide what to do with a webhook from its type + code. We only act on the two
// events that matter for keeping data fresh; everything else is acknowledged
// and ignored (return 200 so Plaid doesn't retry).
export function routeWebhook(
  webhookType: string,
  webhookCode: string,
): WebhookAction {
  if (webhookType === "TRANSACTIONS" && webhookCode === "SYNC_UPDATES_AVAILABLE") {
    return "sync";
  }
  if (webhookType === "ITEM" && webhookCode === "ITEM_LOGIN_REQUIRED") {
    return "reauth";
  }
  return "ignore";
}

// Timing-safe comparison of the raw body's SHA-256 against the hash Plaid
// embedded in the verification JWT. This is what ties a verified signature to
// this specific body — without it, a valid-but-different signed payload could
// be replayed against an attacker-chosen body.
export function bodyHashMatches(rawBody: Buffer, expectedSha256Hex: string): boolean {
  const actual = crypto.createHash("sha256").update(rawBody).digest();
  let expected: Buffer;
  try {
    expected = Buffer.from(expectedSha256Hex, "hex");
  } catch {
    return false;
  }
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

const MAX_WEBHOOK_AGE = "5 min"; // replay window; Plaid signs with a fresh iat

// Verify a Plaid webhook end-to-end (https://plaid.com/docs/api/webhooks/webhook-verification/):
// the Plaid-Verification header is an ES256 JWT signed with a rotating key we
// fetch by `kid`; its `request_body_sha256` claim must match the exact body
// bytes. Returns true only if the signature, freshness, and body hash all check
// out. Any error (missing header, unknown key, bad signature) → false.
export async function verifyPlaidWebhook(
  verificationHeader: string | undefined,
  rawBody: Buffer | undefined,
): Promise<boolean> {
  if (!verificationHeader || !rawBody) return false;

  try {
    const decoded = jwt.decode(verificationHeader, { complete: true });
    if (!decoded || typeof decoded === "string") return false;

    const header = decoded.header as JwtHeader;
    // Pin the algorithm — never let the token's own header talk us into a
    // weaker/none alg.
    if (header.alg !== "ES256" || !header.kid) return false;

    const { data } = await plaidClient.webhookVerificationKeyGet({
      key_id: header.kid,
    });
    const key = data.key;
    // Plaid marks rotated-out keys with an expired_at; refuse them.
    if (key.expired_at) return false;

    const pem = crypto
      .createPublicKey({
        key: { kty: key.kty, crv: key.crv, x: key.x, y: key.y },
        format: "jwk",
      })
      .export({ type: "spki", format: "pem" });

    const claims = jwt.verify(verificationHeader, pem, {
      algorithms: ["ES256"],
      maxAge: MAX_WEBHOOK_AGE,
      clockTolerance: 30,
    }) as { request_body_sha256?: string };

    if (!claims.request_body_sha256) return false;
    return bodyHashMatches(rawBody, claims.request_body_sha256);
  } catch {
    return false;
  }
}
