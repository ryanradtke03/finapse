import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import passport from "passport";
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

  app.use(express.json());
  app.use(cookieParser());
  app.use(passport.initialize());

  app.use('/api/v1', apiLimiter, routes)

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
