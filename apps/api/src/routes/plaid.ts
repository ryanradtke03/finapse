import { Router } from "express";
import { createLinkToken } from "../controllers/plaid";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.post("/create-link-token", requireAuth, createLinkToken);

export default router;