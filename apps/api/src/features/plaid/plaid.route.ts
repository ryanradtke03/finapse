import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import { requireVerifiedEmail } from "../../middleware/requireVerifiedEmail";
import {
    backfillTransactionsHandler,
    createLinkTokenHandler,
    deleteAccount,
    deleteItem,
    exchangePublicTokenHandler,
    getItems,
    syncTransactionsHandler
} from "./plaid.controller";

const router = Router();

router.post("/create-link-token",          requireAuth, requireVerifiedEmail, createLinkTokenHandler);
router.post("/exchange-token",             requireAuth, requireVerifiedEmail, exchangePublicTokenHandler);
router.post("/sync/:itemId",               requireAuth, syncTransactionsHandler);
router.post("/backfill/:itemId",           requireAuth, backfillTransactionsHandler);
router.get("/item" , requireAuth, getItems);
router.delete("/item/:id", requireAuth, deleteItem);
router.delete("/account/:id", requireAuth, deleteAccount)

export default router;
