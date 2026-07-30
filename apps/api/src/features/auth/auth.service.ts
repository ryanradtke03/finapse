import bcrypt from "bcrypt";
import type { CookieOptions } from "express";
import * as jwt from "jsonwebtoken";
import { requireEnv } from "../../config/env";
import { prisma } from "../../db/prisma";
import { decrypt } from "../../lib/encryption";
import { plaidClient } from "../../lib/plaidClient";

const SALT_ROUNDS = 12;

export async function registerUser(data: { email: string; password: string; fullName: string }) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw Object.assign(new Error("Email already in use"), { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash: hashedPassword,
      fullName: data.fullName,
    },
  });

  return user;
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
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function loginUser(input: LoginInput): Promise<{
  user: PublicUser;
  cookie: {
    name: string;
    value: string;
    options: CookieOptions;
  };
}> {
  const email = normalizeEmail(input.email);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, fullName: true, passwordHash: true },
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

  const isProd = process.env.NODE_ENV === "production";

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      hasPassword: user.passwordHash !== "",
    },
    cookie: {
      name: "token",
      value: token,
      options: {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
      },
    },
  };
}

// req.user (from the JWT payload) only carries {id, email, fullName} — never
// passwordHash — so anything that needs hasPassword (Settings page) has to
// hit the DB fresh rather than trusting the token.
export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, fullName: true, passwordHash: true, createdAt: true },
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
  };
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
    throw Object.assign(new Error("Current password is incorrect"), {
      status: 401,
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
