import type { NextFunction, Request, Response } from "express";

// example to use in controllers:
//  throw Object.assign(new Error("Message"), { status: ### });

type ErrorLike = {
  status?: number;
  message?: string;
  type?: string;
};

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const e = err as ErrorLike;

  // JSON parsing error from express.json()
  if (e.type === "entity.parse.failed") {
    return res.status(400).json({
      error: "Invalid JSON body",
    });
  }

  const status = typeof e.status === "number" ? e.status : 500;

  // Log only real server errors
  if (status >= 500) {
    console.error(err);
  }

  return res.status(status).json({
    error:
      status >= 500 ? "Internal server error" : (e.message ?? "Bad Request"),
  });
}
