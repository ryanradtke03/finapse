import type { Request, Response } from "express";
import { rateLimit } from "express-rate-limit";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// 429 responder matching the app's { error } envelope (errorHandler shape),
// so the frontend can read `.error` like every other failure.
function tooManyRequests(_req: Request, res: Response) {
  res
    .status(429)
    .json({ error: "Too many requests, please try again later." });
}

// Loose backstop across the whole API — catches blunt abuse of expensive
// endpoints (Plaid sync, summary scans) without getting in a normal user's way.
export const apiLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 300, // per IP per window
  standardHeaders: true, // RateLimit-* headers
  legacyHeaders: false,
  handler: tooManyRequests,
});

// Strict limiter for credential endpoints (login / register / password).
// `skipSuccessfulRequests` means only FAILED attempts count toward the limit,
// so a legit user logging in repeatedly is fine while brute-force/credential-
// stuffing gets throttled.
export const authLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 10, // failed attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: tooManyRequests,
});
