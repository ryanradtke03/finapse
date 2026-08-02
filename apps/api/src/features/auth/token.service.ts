import { createHash, randomBytes } from "node:crypto";
import { TokenType } from "@prisma/client";
import { prisma } from "../../db/prisma";

// Tokens are random 256-bit values; we store only their SHA-256 hash so a DB
// leak can't be replayed as a working link. (Fast hash is fine here — the
// input is high-entropy, unlike a user password.)
function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Create a single-use token of `type` for the user, invalidating any prior
 * unused tokens of the same type (so requesting a new link retires old ones).
 * Returns the RAW token — only ever seen here and in the emailed link; only
 * its hash is persisted.
 */
export async function createToken(
  userId: string,
  type: TokenType,
  ttlMs: number,
): Promise<string> {
  const raw = randomBytes(32).toString("base64url");

  await prisma.token.deleteMany({ where: { userId, type, usedAt: null } });

  await prisma.token.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + ttlMs),
    },
  });

  return raw;
}

/**
 * Validate and consume a token: it must exist, match `type`, be unused, and
 * be unexpired. On success it's marked used (single-use) and the userId is
 * returned; otherwise null.
 */
export async function consumeToken(
  raw: string,
  type: TokenType,
): Promise<string | null> {
  const token = await prisma.token.findUnique({
    where: { tokenHash: hashToken(raw) },
  });

  if (
    !token ||
    token.type !== type ||
    token.usedAt !== null ||
    token.expiresAt < new Date()
  ) {
    return null;
  }

  await prisma.token.update({
    where: { id: token.id },
    data: { usedAt: new Date() },
  });

  return token.userId;
}
