import { requireAuth } from "../../middleware/requireAuth";
import { Router } from 'express';
import {
  deleteTransactionHandler,
  getTransactionByIdHandler,
  getTransactionCategoriesHandler,
  getTransactionHandler,
  getTransactionSummaryHandler,
  updateTransactionHandler,
} from './transaction.controller';

const router = Router();

router.get("/", requireAuth, getTransactionHandler)
router.get("/summary", requireAuth, getTransactionSummaryHandler)
router.get("/categories", requireAuth, getTransactionCategoriesHandler)
router.get("/:id", requireAuth, getTransactionByIdHandler)
router.patch("/:id", requireAuth, updateTransactionHandler)
router.delete("/:id", requireAuth, deleteTransactionHandler)


export default router;