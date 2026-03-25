import { Router } from "express";
import {
    createLinkTokenHandler,
    exchangePublicTokenHandler,
    syncTransactionsHandler,
} from "../controllers/plaid";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.post("/create-link-token",          requireAuth, createLinkTokenHandler);
router.post("/exchange-token",             requireAuth, exchangePublicTokenHandler);
router.post("/sync/:itemId",               requireAuth, syncTransactionsHandler);

export default router;