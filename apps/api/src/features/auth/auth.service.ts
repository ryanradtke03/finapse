import bcrypt from "bcrypt";
import type { CookieOptions } from "express";
import * as jwt from "jsonwebtoken";
import { requireEnv } from "../../config/env";
import { prisma } from "../../db/prisma";

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

  const token = jwt.sign({ sub: user.id, email: user.email, fullName: user.fullName }, secret, {
      expiresIn,
  })

  const isProd = process.env.NODE_ENV === "production";

  return {
    user: { id: user.id, email: user.email, fullName: user.fullName },
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
