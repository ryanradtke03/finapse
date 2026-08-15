import type { CookieOptions, Response } from "express";

const AUTH_COOKIE_NAME = "token";

export function authCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === "production";

  // "none" is the permissive setting: it works whether the browser reaches the
  // API same-origin (through the frontend's /api/* rewrite — see render.yaml)
  // or cross-origin. Note that SameSite=None only grants *permission* to send a
  // cross-site cookie; it does not defeat third-party cookie blocking, which
  // iOS Safari applies by default. That is why the deploy proxies /api through
  // the frontend origin rather than relying on this flag.
  //
  // Once every client is confirmed to go through that proxy, this can tighten
  // to "lax" for free CSRF protection.
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
