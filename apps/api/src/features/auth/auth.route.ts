import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import { authLimiter, emailLimiter } from "../../middleware/rateLimit";
import { blockInDemoMode } from "../../middleware/demoGuard";
import {
  changePassword,
  deleteAccount,
  forgotPasswordHandler,
  googleAuth,
  googleAuthCallback,
  login,
  logout,
  me,
  register,
  resendVerificationHandler,
  resetPasswordHandler,
  updateProfile,
  verifyEmailHandler,
} from "./auth.controller";

const router = Router();

// blockInDemoMode: disabled on the public demo so a visitor can't spam signups
// or break the shared demo account (delete it, change its password, etc.).
router.post("/register", blockInDemoMode, authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/me", requireAuth, me);
router.put("/me", requireAuth, updateProfile);
router.post("/logout", logout);
router.put("/password", blockInDemoMode, authLimiter, requireAuth, changePassword);
router.delete("/me", blockInDemoMode, requireAuth, deleteAccount);

// Email verification + password reset (rate-limited; token endpoints are
// public since the user may be logged out when they click the link).
router.post("/verify-email", authLimiter, verifyEmailHandler);
router.post("/resend-verification", emailLimiter, requireAuth, resendVerificationHandler);
router.post("/forgot-password", blockInDemoMode, emailLimiter, forgotPasswordHandler);
router.post("/reset-password", blockInDemoMode, authLimiter, resetPasswordHandler);
router.get("/google", googleAuth);
router.get("/google/callback", googleAuthCallback);

export default router;
