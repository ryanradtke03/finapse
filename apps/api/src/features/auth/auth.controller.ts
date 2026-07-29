import type { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import passport from "passport";
import { z } from "zod";
import { clearAuthCookie, setAuthCookie } from "./auth.cookies";
import { loginUser, registerUser } from "./auth.service";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = registerSchema.parse(req.body);
    const user = await registerUser(parsed);

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = loginSchema.parse(req.body);

    const result = await loginUser(parsed);

    setAuthCookie(res, result.cookie.value);

    return res.status(200).json({
      user: result.user,
    });
  } catch (err) {
    // Keep login errors generic at the edge
    if (err instanceof z.ZodError) {
      return next(httpError(400, "Invalid request body"));
    }
    return next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw httpError(401, "Not authenticated");
    }

    return res.status(200).json({
      user: {
        id: req.user.id,
        email: req.user.email,
        fullName: req.user.fullName,
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function logout(_req: Request, res: Response) {
  clearAuthCookie(res);
  return res.status(204).send();
}

export const googleAuth = passport.authenticate("google", {scope: ["email", "profile"]});

export const googleAuthCallback = [
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  (req: Request, res: Response) => {
    const user = req.user as { id: string; email: string; fullName: string };
    const token = jwt.sign(
      { sub: user.id, email: user.email, fullName: user.fullName },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" } // match whatever you use elsewhere
    );
    setAuthCookie(res, token);
    const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
    res.redirect(`${clientOrigin}/dashboard`);
  },
];
