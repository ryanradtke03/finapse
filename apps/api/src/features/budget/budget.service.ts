import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/client";
import { prisma } from "../../db/prisma";
import { CreateBudgetInput, UpdateBudgetInput } from "./budget.schema";

export async function createBudget(userId: string, data: CreateBudgetInput){

    const {category, limitAmount, periodStart} = data;

    try {
        const budget = await prisma.budget.create({
            data:{
                userId,
                category,
                limitAmount: new Decimal(limitAmount),
                periodStart: new Date(periodStart),
            }
        })

        return budget;
    } catch (err) {
        // Unique constraint @@unique([userId, category, periodStart]) — a budget
        // already exists for this category + period. Surface a 409 instead of
        // letting the raw Prisma error fall through as a generic 500 (FIN-81).
        if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2002"
        ) {
            throw Object.assign(
                new Error("A budget for this category already exists this period"),
                { status: 409 },
            );
        }
        throw err;
    }
}

export async function listBudgets(userId: string, periodStart?: string) {
    return prisma.budget.findMany({
        where: {
            userId,
            ...(periodStart && { periodStart: new Date(periodStart) }),
        },
    });
}

// Copy every budget from the `from` month into the `to` month. Categories
// already budgeted in `to` are skipped (skipDuplicates) so re-running is safe
// and won't clobber existing limits. Returns how many were copied.
export async function copyBudgets(userId: string, from: string, to: string) {
    const source = await prisma.budget.findMany({
        where: { userId, periodStart: new Date(from) },
    });

    if (source.length === 0) return { copied: 0 };

    const result = await prisma.budget.createMany({
        data: source.map((b) => ({
            userId,
            category: b.category,
            limitAmount: b.limitAmount,
            periodStart: new Date(to),
        })),
        skipDuplicates: true,
    });

    return { copied: result.count };
}

export async function getBudget(userId: string, budgetId: string){
    const budget = await prisma.budget.findUnique({
        where: { id: budgetId },
      });
    
      if (!budget || budget.userId !== userId) {
        throw Object.assign(new Error("Budget not found"), { status: 404 });
      }
    
      return budget;
}


export async function deleteBudget(userId: string, budgetId: string) {
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
    });
  
    if (!budget || budget.userId !== userId) {
      throw Object.assign(new Error("Budget not found"), { status: 404 });
    }
  
    await prisma.budget.delete({
      where: { id: budgetId },
    });
}

export async function updateBudget(userId: string, budgetId: string, data: UpdateBudgetInput){
    const budget = await prisma.budget.findUnique({
        where: { id: budgetId },
      });
    
      if (!budget || budget.userId !== userId) {
        throw Object.assign(new Error("Budget not found"), { status: 404 });
      }
    
      return prisma.budget.update({
        where: { id: budgetId },
        data: {
          ...data,
          ...(data.limitAmount && { limitAmount: new Decimal(data.limitAmount) }),
          ...(data.periodStart && { periodStart: new Date(data.periodStart) }),
        },
      });
}