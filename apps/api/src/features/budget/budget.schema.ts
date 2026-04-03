import { z } from "zod";

export const createBudgetSchema = z.object({
  category: z.string().min(1),
  limitAmount: z.string(),
  periodStart: z.string(),
});

export const updateBudgetSchema = createBudgetSchema.partial();

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;