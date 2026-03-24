import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { requireEnv } from "../config/env";

// ─────────────────────────────────────────
// AES-256-GCM encryption for Plaid access tokens
//
// Format stored in DB:
//   iv:authTag:ciphertext  (all hex, colon-separated)
//
// ENCRYPTION_KEY must be a 64-char hex string (32 bytes)
// Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
// ─────────────────────────────────────────

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;   // 96-bit IV — recommended for GCM
const TAG_BYTES = 16;  // 128-bit auth tag — GCM default

function getKey(): Buffer {
  const hex = requireEnv("ENCRYPTION_KEY");

  if (hex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be a 64-character hex string (32 bytes). " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }

  return Buffer.from(hex, "hex");
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_BYTES);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Store as iv:authTag:ciphertext — all hex
  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

export function decrypt(stored: string): string {
  const key = getKey();
  const parts = stored.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted value format — expected iv:authTag:ciphertext");
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;
  const iv         = Buffer.from(ivHex, "hex");
  const authTag    = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}