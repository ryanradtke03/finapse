import { requireAuth } from "../../middleware/requireAuth";
import { Router } from 'express';
import {
  getTransactionByIdHandler,
  getTransactionCategoriesHandler,
  getTransactionHandler,
  getTransactionSummaryHandler,
  updateTransactionCategoryHandler,
} from './transaction.controller';

const router = Router();

router.get("/", requireAuth, getTransactionHandler)
router.get("/summary", requireAuth, getTransactionSummaryHandler)
router.get("/categories", requireAuth, getTransactionCategoriesHandler)
router.get("/:id", requireAuth, getTransactionByIdHandler)
router.patch("/:id", requireAuth, updateTransactionCategoryHandler)


export default router;