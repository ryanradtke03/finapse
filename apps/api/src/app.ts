import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import passport from "passport";
import "./features/auth/google-strategy";
import authRoutes from "./features/auth/auth.routes";
import healthRouter from "./features/health/health.route";
import plaidRouter from "./features/plaid/plaid.routes";
import { errorHandler } from "./middleware/error-handler";
import { notFound } from "./middleware/not-found";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: ["http://localhost:5173", "http://localhost:5174"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      // set this to true ONLY if you're using cookies for auth
      credentials: true,
    }),
  );

  app.use(express.json());
  app.use(cookieParser());

  app.use(passport.initialize());
  app.use(healthRouter);
  app.use("/auth", authRoutes);
  app.use("/plaid", plaidRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
