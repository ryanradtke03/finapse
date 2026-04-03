import { requireAuth } from "../../middleware/requireAuth";
import { Router } from 'express';
import { getTransactionByIdHandler, getTransactionHandler, getTransactionSummaryHandler } from './transaction.controller';

const router = Router();

router.get("/", requireAuth, getTransactionHandler)
router.get("/summary", requireAuth, getTransactionSummaryHandler)
router.get("/:id", requireAuth, getTransactionByIdHandler)


export default router;