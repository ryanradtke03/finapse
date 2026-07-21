import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import passport from "passport";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import routes from './routes';


export function createApp() {
  const app = express();

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

  app.use('/api/v1', routes)

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
