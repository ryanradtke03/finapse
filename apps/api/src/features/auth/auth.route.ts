import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import { authLimiter } from "../../middleware/rateLimit";
import {
  changePassword,
  deleteAccount,
  googleAuth,
  googleAuthCallback,
  login,
  logout,
  me,
  register,
  updateProfile,
} from "./auth.controller";

const router = Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/me", requireAuth, me);
router.put("/me", requireAuth, updateProfile);
router.post("/logout", logout);
router.put("/password", authLimiter, requireAuth, changePassword);
router.delete("/me", requireAuth, deleteAccount);
router.get("/google", googleAuth);
router.get("/google/callback", googleAuthCallback);

export default router;
