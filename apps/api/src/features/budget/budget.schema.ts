import { z } from "zod";

export const createBudgetSchema = z.object({
  category: z.string().min(1),
  limitAmount: z.string(),
  periodStart: z.string(),
});

export const updateBudgetSchema = createBudgetSchema.partial();

// Copy every budget from one month (`from`) into another (`to`).
export const copyBudgetSchema = z.object({
  from: z.string(),
  to: z.string(),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type CopyBudgetInput = z.infer<typeof copyBudgetSchema>;
