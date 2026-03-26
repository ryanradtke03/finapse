import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import { googleAuth, googleAuthCallback, login, logout, me, register } from "./auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/logout", logout);
router.get("/google", googleAuth);
router.get("/google/callback", googleAuthCallback);

export default router;
