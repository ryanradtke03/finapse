import { Router } from "express";
import { prisma } from "../../db/prisma";
import * as crypto from "node:crypto";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: "ok" });
  } catch (err) {
    console.error("health db check failed:", err);
    res.status(500).json({ ok: false, db: "down" });
  }
});

// TEMPORARY — remove once TRUST_PROXY is confirmed.
//
// The frontend proxies /api/* to this service (see render.yaml), which adds a
// hop to the X-Forwarded-For chain. Express resolves req.ip by counting hops
// back from the right using the `trust proxy` setting, so an out-of-date
// TRUST_PROXY makes req.ip resolve to the *proxy's* address — identical for
// every visitor. That would collapse all users into one rate-limit bucket
// (apiLimiter is 300/IP/15min, authLimiter 10 failed attempts), so the whole
// site would start 429ing under normal traffic.
//
// This endpoint reports what the app actually sees, so TRUST_PROXY can be set
// from evidence instead of guesswork. Disabled unless PROXY_DEBUG_TOKEN is set,
// and requires that token — it exposes client IPs, which are personal data.
//
//   curl "https://<web-host>/api/v1/health/proxy?token=$PROXY_DEBUG_TOKEN"
//
// Compare `resolvedIp` across two different networks (e.g. laptop on wifi vs
// phone on cellular):
//   - different values  → TRUST_PROXY is correct, limiter keys per user
//   - identical values  → TRUST_PROXY is too low; raise it so resolvedIp lands
//                         on the leftmost (client) entry of forwardedFor
router.get("/proxy", (req, res) => {
  const expected = process.env.PROXY_DEBUG_TOKEN;

  if (!expected) {
    return res.status(404).json({ error: "Not found" });
  }

  // Constant-time compare so the token can't be recovered by timing.
  const provided = String(req.query.token ?? "");
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(404).json({ error: "Not found" });
  }

  return res.json({
    // What the rate limiter actually keys on.
    resolvedIp: req.ip,
    // The raw chain. Leftmost entry is the real client; each proxy appends the
    // address it received the request from. Count the entries to get the hop
    // count TRUST_PROXY should equal.
    forwardedFor: req.headers["x-forwarded-for"] ?? null,
    hopCount: String(req.headers["x-forwarded-for"] ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean).length,
    // Current setting, for comparison against hopCount.
    trustProxySetting: process.env.TRUST_PROXY ?? "(unset)",
    // Confirms the request arrived via the frontend proxy rather than direct.
    host: req.headers.host ?? null,
    origin: req.headers.origin ?? null,
  });
});

export default router;
