import type { NextFunction, Request, Response } from "express";

// The public demo runs with DEMO_MODE=true. It funnels everyone through the
// shared, pre-seeded demo account (see prisma/seed.ts) and locks down the
// self-service actions that would let a visitor spam signups or break the demo
// for everyone else (delete/rename-away the account, change its password, etc.).
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

// Blocks a route when the deployment is in demo mode. Applied to signup and the
// destructive auth actions; everything needed to *use* the demo (login, logout,
// viewing/editing data) stays open.
export function blockInDemoMode(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (isDemoMode()) {
    return res
      .status(403)
      .json({ error: "This action is disabled in the demo." });
  }
  return next();
}
