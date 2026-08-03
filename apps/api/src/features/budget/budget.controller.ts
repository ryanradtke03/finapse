import type { NextFunction, Request, Response } from "express";
import { copyBudgetSchema, createBudgetSchema, updateBudgetSchema } from "./budget.schema";
import { copyBudgets, createBudget, deleteBudget, getBudget, listBudgets, updateBudget } from "./budget.service";

export async function createBudgetHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    const parsed = createBudgetSchema.safeParse(req.body);
    if (!parsed.success) {
      const err = Object.assign(new Error("Invalid request body"), { status: 400 });
      return next(err);
    }

    const budget = await createBudget(userId, parsed.data);

    return res.status(201).json(budget);
  } catch (err) {
    return next(err);
  }
}

export async function listBudgetHandler(req: Request, res: Response, next: NextFunction){
    try{
        const userId = req.user!.id;

        const periodStart =
            typeof req.query.periodStart === "string"
                ? req.query.periodStart
                : undefined;

        const budgets = await listBudgets(userId, periodStart);

        return res.status(200).json(budgets);

    }catch(err){
        next(err)
    }

}

export async function copyBudgetHandler(req: Request, res: Response, next: NextFunction){
    try{
        const userId = req.user!.id;

        const parsed = copyBudgetSchema.safeParse(req.body);
        if (!parsed.success) {
            return next(
                Object.assign(new Error("Invalid request body"), { status: 400 }),
            );
        }

        const result = await copyBudgets(userId, parsed.data.from, parsed.data.to);

        return res.status(200).json(result);

    }catch(err){
        next(err)
    }
}

export async function getBudgetHandler(req: Request, res: Response, next: NextFunction){
    try{
        const userId = req.user!.id;
        const {id} = req.params;

        const budget = await getBudget(userId, id);

        return res.status(200).json(budget);
        
    }catch(err){
        next(err)
    }
}

export async function deleteBudgetHandler(req: Request, res: Response, next: NextFunction){
    try{
        const userId = req.user!.id;
        const {id} = req.params;

        const budget = await deleteBudget(userId, id);

        return res.status(200).json(budget);
        
    }catch(err){
        next(err)
    }
}

export async function updateBudgetHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
  
      const parsed = updateBudgetSchema.safeParse(req.body);
      if (!parsed.success) {
        const err = Object.assign(new Error("Invalid request body"), { status: 400 });
        return next(err);
      }
  
      const budget = await updateBudget(userId, id, parsed.data);
  
      return res.status(200).json(budget);
    } catch (err) {
      return next(err);
    }
  }