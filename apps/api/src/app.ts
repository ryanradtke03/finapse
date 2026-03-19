import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import passport from "passport";
import "./auth/googleStrategy";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import authRoutes from "./routes/auth";
import healthRouter from "./routes/health";
import recipiesRouter from "./routes/recipie";

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
  app.use("/recipies", recipiesRouter);
  app.use("/auth", authRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
