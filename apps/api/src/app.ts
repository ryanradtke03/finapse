import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import passport from "passport";
// Side-effect import: registers the Google OAuth strategy via passport.use()
// so `passport.authenticate("google")` resolves. Without this the strategy is
// never registered ("Unknown authentication strategy 'google'").
import "./features/auth/auth.googleStrategy";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { apiLimiter } from "./middleware/rateLimit";
import routes from './routes';


export function createApp() {
  const app = express();

  // Rate limiters key on req.ip. Behind a proxy/load balancer that's the
  // proxy's IP unless we trust it — but blindly trusting all proxies lets
  // clients spoof X-Forwarded-For to dodge limits. So this is opt-in via
  // TRUST_PROXY (set it to the number of proxy hops, e.g. "1", in prod);
  // off by default, which is correct for local dev.
  const trustProxy = process.env.TRUST_PROXY;
  if (trustProxy) {
    const hops = Number(trustProxy);
    app.set("trust proxy", Number.isFinite(hops) ? hops : trustProxy);
  }

  const clientOrigins = (
    process.env.CLIENT_ORIGIN ?? "http://localhost:5173,http://localhost:5174"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: clientOrigins,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      // set this to true ONLY if you're using cookies for auth
      credentials: true,
    }),
  );

  // Stash the raw body bytes alongside the parsed JSON. Plaid signs each
  // webhook with a JWT whose payload includes a SHA-256 of the exact request
  // body, so verifying it (see plaid.webhook.ts) needs the original bytes, not
  // the re-serialized parsed object.
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as express.Request).rawBody = buf;
      },
    }),
  );
  app.use(cookieParser());
  app.use(passport.initialize());

  app.use('/api/v1', apiLimiter, routes)

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
