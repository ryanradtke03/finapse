import { Router } from 'express';
import { requireAuth } from "../../middleware/requireAuth";
import { copyBudgetHandler, createBudgetHandler, deleteBudgetHandler, getBudgetHandler, listBudgetHandler, updateBudgetHandler } from "./budget.controller";

const router = Router();

router.post("/", requireAuth,  createBudgetHandler);
router.post("/copy", requireAuth, copyBudgetHandler);
router.get("/", requireAuth,  listBudgetHandler)
router.get("/:id", requireAuth,  getBudgetHandler)
router.put("/:id", requireAuth, updateBudgetHandler);
router.delete("/:id", requireAuth, deleteBudgetHandler);


export default router;