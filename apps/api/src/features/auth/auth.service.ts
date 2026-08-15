import bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { requireEnv } from "../../config/env";
import { prisma } from "../../db/prisma";
import { decrypt } from "../../lib/encryption";
import { sendEmail } from "../../lib/email";
import { passwordResetEmail, verificationEmail } from "../../lib/emailTemplates";
import { plaidClient } from "../../lib/plaidClient";
import { createToken, consumeToken } from "./token.service";

const SALT_ROUNDS = 12;

const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

// Where the emailed links point (the frontend). Falls back to the first
// configured client origin, then localhost.
function appUrl(): string {
  return (
    process.env.APP_URL ??
    process.env.CLIENT_ORIGIN ??
    "http://localhost:5173"
  )
    .split(",")[0]
    .trim();
}

async function sendVerificationEmail(user: { id: string; email: string }) {
  const token = await createToken(
    user.id,
    "EMAIL_VERIFY",
    EMAIL_VERIFY_TTL_MS,
  );
  const link = `${appUrl()}/verify-email?token=${token}`;
  await sendEmail({ to: user.email, ...verificationEmail(link) });
}

export async function registerUser(data: { email: string; password: string; fullName: string }) {
  // Normalize like loginUser does — otherwise "Foo@x.com" registers but can
  // never log in (login lowercases), and casing mismatches let duplicate
  // accounts slip past the unique-email check vs Google sign-ins (FIN-103).
  const email = normalizeEmail(data.email);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw Object.assign(new Error("Email already in use"), { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      fullName: data.fullName,
    },
  });

  // Kick off email verification. Best-effort: a failure here must NOT fail the
  // whole registration (the account already exists) — the user can resend from
  // the app's "verify your email" banner.
  try {
    await sendVerificationEmail(user);
  } catch (err) {
    console.error("[registerUser] verification email failed to send:", err);
  }

  return user;
}

// Confirm ownership of the email via a verification token (from the emailed
// link). Marks the user verified. Throws 400 on an invalid/expired token.
export async function verifyEmail(rawToken: string) {
  const userId = await consumeToken(rawToken, "EMAIL_VERIFY");
  if (!userId) {
    throw Object.assign(
      new Error("This verification link is invalid or has expired."),
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true },
  });
}

// Re-issue a verification email for the current user. Returns false (no email
// sent) if the user is already verified, so the caller can react.
export async function resendVerification(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, emailVerified: true },
  });
  if (!user || user.emailVerified) return false;
  await sendVerificationEmail(user);
  return true;
}

// Begin a password reset. Always resolves without revealing whether the email
// exists (anti-enumeration); only sends a link when there's a password
// account for it (Google-only accounts have no password to reset).
export async function requestPasswordReset(rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true },
  });

  if (!user || !user.passwordHash) return;

  const token = await createToken(
    user.id,
    "PASSWORD_RESET",
    PASSWORD_RESET_TTL_MS,
  );
  const link = `${appUrl()}/reset-password?token=${token}`;
  await sendEmail({ to: user.email, ...passwordResetEmail(link) });
}

// Complete a password reset with a valid token. Completing it proves the user
// controls the inbox, so we also mark the email verified. Throws 400 on an
// invalid/expired token.
export async function resetPassword(rawToken: string, newPassword: string) {
  const userId = await consumeToken(rawToken, "PASSWORD_RESET");
  if (!userId) {
    throw Object.assign(
      new Error("This reset link is invalid or has expired."),
      { status: 400 },
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPassword, emailVerified: true },
  });
}

type LoginInput = {
  email: string;
  password: string;
};

type PublicUser = {
  id: string;
  email: string;
  fullName: string;
  hasPassword: boolean;
  emailVerified: boolean;
  provider: "google" | "password";
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

// Google sign-ups are created with an empty passwordHash (see
// auth.googleStrategy.ts), so the sign-in provider is derivable — no separate
// column needed.
export function authProviderFor(passwordHash: string): "google" | "password" {
  return passwordHash === "" ? "google" : "password";
}

// Returns the signed JWT, not cookie options. Setting the cookie is the
// controller's job (auth.cookies.ts owns the flags) — this used to also return
// an `options` object that no caller read, which quietly disagreed with the
// real flags. One source of truth now.
export async function loginUser(input: LoginInput): Promise<{
  user: PublicUser;
  token: string;
}> {
  const email = normalizeEmail(input.email);

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      fullName: true,
      passwordHash: true,
      emailVerified: true,
    },
  });

  if (!user) {
    throw Object.assign(new Error("Invalid email or password"), {
      status: 401,
    });
  }

  const ok = await bcrypt.compare(input.password, user.passwordHash);

  if (!ok) {
    throw Object.assign(new Error("Invalid email or password"), {
      status: 401,
    });
  }

  const secret: jwt.Secret = requireEnv("JWT_SECRET");
  const expiresIn: jwt.SignOptions["expiresIn"] = (process.env.JWT_EXPIRES_IN ??
    "7d") as jwt.SignOptions["expiresIn"];

  const token = jwt.sign(
    { sub: user.id, email: user.email, fullName: user.fullName },
    secret,
    { expiresIn },
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      hasPassword: user.passwordHash !== "",
      emailVerified: user.emailVerified,
      provider: authProviderFor(user.passwordHash),
    },
    token,
  };
}

// req.user (from the JWT payload) only carries {id, email, fullName} — never
// passwordHash — so anything that needs hasPassword (Settings page) has to
// hit the DB fresh rather than trusting the token.
export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      passwordHash: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    createdAt: user.createdAt.toISOString(),
    hasPassword: user.passwordHash !== "",
    emailVerified: user.emailVerified,
    provider: authProviderFor(user.passwordHash),
  };
}

// Update editable profile fields (currently just the display name). Returns
// the same shape as getUserProfile so callers can refresh their user state.
export async function updateUserProfile(
  userId: string,
  data: { fullName: string },
) {
  await prisma.user.update({
    where: { id: userId },
    data: { fullName: data.fullName },
  });

  return getUserProfile(userId);
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }

  // Google-only accounts are created with passwordHash: "" (see
  // auth.googleStrategy.ts) — there's no password to change.
  if (!user.passwordHash) {
    throw Object.assign(
      new Error("Password changes aren't available for Google sign-in accounts"),
      { status: 400 },
    );
  }

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    // 400, not 401: the user IS authenticated — their input is just wrong.
    // A 401 here reads as "session invalid" and can trip client-side
    // auth interceptors into logging the user out.
    throw Object.assign(new Error("Current password is incorrect"), {
      status: 400,
    });
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPassword },
  });
}

// Deletes the user and everything that belongs to them. Prisma's schema
// cascades User -> PlaidItem -> Account -> Transaction, and User -> Budget,
// so a single user.delete is enough at the DB level — the only thing that
// needs doing manually first is revoking each PlaidItem's access token with
// Plaid itself (deleting our row doesn't invalidate anything on their end).
export async function deleteUserAccount(userId: string): Promise<void> {
  const items = await prisma.plaidItem.findMany({
    where: { userId },
    select: { id: true, accessToken: true },
  });

  for (const item of items) {
    try {
      await plaidClient.itemRemove({ access_token: decrypt(item.accessToken) });
    } catch (err) {
      console.warn(
        `[deleteUserAccount] Plaid itemRemove failed for item ${item.id}, proceeding with delete:`,
        err,
      );
    }
  }

  await prisma.user.delete({ where: { id: userId } });
}
