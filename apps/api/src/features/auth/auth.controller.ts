import type { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import passport from "passport";
import { z } from "zod";
import { clearAuthCookie, setAuthCookie } from "./auth.cookies";
import {
  authProviderFor,
  changeUserPassword,
  deleteUserAccount,
  getUserProfile,
  loginUser,
  registerUser,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  updateUserProfile,
  verifyEmail,
} from "./auth.service";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
});

const tokenSchema = z.object({
  token: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = registerSchema.parse(req.body);
    const user = await registerUser(parsed);

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        createdAt: user.createdAt,
        hasPassword: user.passwordHash !== "",
        emailVerified: user.emailVerified,
        provider: authProviderFor(user.passwordHash),
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = loginSchema.parse(req.body);

    const result = await loginUser(parsed);

    setAuthCookie(res, result.token);

    return res.status(200).json({
      user: result.user,
    });
  } catch (err) {
    // Keep login errors generic at the edge
    if (err instanceof z.ZodError) {
      return next(httpError(400, "Invalid request body"));
    }
    return next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw httpError(401, "Not authenticated");
    }

    const user = await getUserProfile(req.user.id);

    return res.status(200).json({ user });
  } catch (err) {
    return next(err);
  }
}

export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) throw httpError(401, "Not authenticated");

    const parsed = updateProfileSchema.parse(req.body);
    const user = await updateUserProfile(req.user.id, {
      fullName: parsed.fullName,
    });

    return res.status(200).json({ user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(httpError(400, "Invalid request body"));
    }
    return next(err);
  }
}

export async function logout(_req: Request, res: Response) {
  clearAuthCookie(res);
  return res.status(204).send();
}

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) throw httpError(401, "Not authenticated");

    const parsed = changePasswordSchema.parse(req.body);
    await changeUserPassword(req.user.id, parsed.currentPassword, parsed.newPassword);

    return res.status(200).json({ message: "Password updated" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(httpError(400, "Invalid request body"));
    }
    return next(err);
  }
}

export async function deleteAccount(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) throw httpError(401, "Not authenticated");

    await deleteUserAccount(req.user.id);
    clearAuthCookie(res);

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

export async function verifyEmailHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = tokenSchema.safeParse(req.body);
    if (!parsed.success) return next(httpError(400, "Invalid request body"));

    await verifyEmail(parsed.data.token);
    return res.status(200).json({ message: "Email verified" });
  } catch (err) {
    return next(err);
  }
}

export async function resendVerificationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) throw httpError(401, "Not authenticated");

    const sent = await resendVerification(req.user.id);
    return res.status(200).json({ sent });
  } catch (err) {
    return next(err);
  }
}

export async function forgotPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) return next(httpError(400, "Invalid request body"));

    await requestPasswordReset(parsed.data.email);
    // Always the same response, whether or not the email exists (anti-enumeration).
    return res.status(200).json({
      message: "If an account exists for that email, a reset link has been sent.",
    });
  } catch (err) {
    return next(err);
  }
}

export async function resetPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) return next(httpError(400, "Invalid request body"));

    await resetPassword(parsed.data.token, parsed.data.newPassword);
    return res.status(200).json({ message: "Password updated" });
  } catch (err) {
    return next(err);
  }
}

export const googleAuth = passport.authenticate("google", {scope: ["email", "profile"]});

// CLIENT_ORIGIN may be a comma-separated list (multiple dev ports) — redirects
// need a single origin, so take the first.
function firstClientOrigin(): string {
  return (process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
    .split(",")[0]
    .trim();
}

// Custom passport callback (rather than the array form) so we can turn a
// verify-step failure — e.g. the Google email belongs to a password account
// (FIN-103) — into a friendly redirect back to the frontend instead of a
// broken relative `/login` redirect on the API host.
export function googleAuthCallback(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  passport.authenticate(
    "google",
    { session: false },
    (
      err: unknown,
      user: { id: string; email: string; fullName: string } | false | null,
      info: { message?: string } | undefined,
    ) => {
      const clientOrigin = firstClientOrigin();

      if (err) return next(err);

      if (!user) {
        const reason =
          info?.message === "account_exists_password"
            ? "account_exists"
            : "google_failed";
        return res.redirect(`${clientOrigin}/?authError=${reason}`);
      }

      const token = jwt.sign(
        { sub: user.id, email: user.email, fullName: user.fullName },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" },
      );
      setAuthCookie(res, token);
      return res.redirect(`${clientOrigin}/dashboard`);
    },
  )(req, res, next);
}
