import type { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { requireEnv } from "../config/env";

type JwtPayload = {
  sub: string; // user id
  email: string;
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      throw Object.assign(new Error("Not authenticated"), { status: 401 });
    }

    const secret = requireEnv("JWT_SECRET");

    const decode = jwt.verify(token, secret) as JwtPayload;
    const userId = decode.sub;

    if (!userId || typeof userId !== "string") {
      throw Object.assign(new Error("Not authenticated"), { status: 401 });
    }

    req.user = {
      id: userId,
      email: typeof decode.email === "string" ? decode.email : "",
    };

    return next();
  } catch {
    return next(Object.assign(new Error("Not authenticated"), { status: 401 }));
  }
}
