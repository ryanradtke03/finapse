import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import {
    createLinkTokenHandler,
    deleteAccount,
    deleteItem,
    exchangePublicTokenHandler,
    getAccounts,
    getItems,
    syncTransactionsHandler
} from "./plaid.controller";

const router = Router();

router.post("/create-link-token",          requireAuth, createLinkTokenHandler);
router.post("/exchange-token",             requireAuth, exchangePublicTokenHandler);
router.post("/sync/:itemId",               requireAuth, syncTransactionsHandler);
router.get("/item" , requireAuth, getItems);
router.delete("/item/:id", requireAuth, deleteItem);
router.get("/account", requireAuth, getAccounts);
router.delete("/account/:id", requireAuth, deleteAccount)


export default router;
