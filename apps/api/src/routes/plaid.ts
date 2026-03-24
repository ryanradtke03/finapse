import { Router } from "express";
import {
    createLinkTokenHandler,
    createUpdateLinkTokenHandler,
    exchangePublicTokenHandler,
    syncTransactionsHandler,
} from "../controllers/plaid";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.post("/create-link-token",          requireAuth, createLinkTokenHandler);
router.post("/update-link-token/:itemId",  requireAuth, createUpdateLinkTokenHandler);
router.post("/exchange-token",             requireAuth, exchangePublicTokenHandler);
router.post("/sync/:itemId",               requireAuth, syncTransactionsHandler);

export default router;