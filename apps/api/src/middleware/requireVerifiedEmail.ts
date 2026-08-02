import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma";

/**
 * Blocks bank-connection actions until the user has verified their email.
 * Runs after requireAuth (which populates req.user). The JWT doesn't carry
 * emailVerified, so we read it fresh from the DB.
 */
export async function requireVerifiedEmail(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      return next(
        Object.assign(new Error("Not authenticated"), { status: 401 }),
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { emailVerified: true },
    });

    if (!user?.emailVerified) {
      return next(
        Object.assign(
          new Error("Please verify your email before connecting a bank."),
          { status: 403 },
        ),
      );
    }

    return next();
  } catch (err) {
    return next(err);
  }
}
