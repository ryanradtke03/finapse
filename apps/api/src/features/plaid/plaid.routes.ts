import { Router } from "express";
import { requireAuth } from "../../middleware/require-auth";
import {
    createLinkTokenHandler,
    exchangePublicTokenHandler,
    syncTransactionsHandler,
} from "./plaid.controller";

const router = Router();

router.post("/create-link-token",          requireAuth, createLinkTokenHandler);
router.post("/exchange-token",             requireAuth, exchangePublicTokenHandler);
router.post("/sync/:itemId",               requireAuth, syncTransactionsHandler);

export default router;
