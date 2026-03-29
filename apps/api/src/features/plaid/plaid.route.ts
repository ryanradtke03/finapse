import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import {
    createLinkTokenHandler,
    exchangePublicTokenHandler,
    getItems,
    syncTransactionsHandler
} from "./plaid.controller";

const router = Router();

router.post("/create-link-token",          requireAuth, createLinkTokenHandler);
router.post("/exchange-token",             requireAuth, exchangePublicTokenHandler);
router.post("/sync/:itemId",               requireAuth, syncTransactionsHandler);
router.get("/item" , requireAuth, getItems)

export default router;
