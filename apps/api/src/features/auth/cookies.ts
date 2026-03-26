import type { CookieOptions, Response } from "express";

const AUTH_COOKIE_NAME = "token";

export function authCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === "production";

  const sameSite: CookieOptions["sameSite"] = isProd ? "none" : "lax";

  return {
    httpOnly: true,
    secure: isProd,
    sameSite,
    path: "/",
  };
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions());
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions());
}

export function getAuthCookieName() {
  return AUTH_COOKIE_NAME;
}
