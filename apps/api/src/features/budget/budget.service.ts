import { Decimal } from "@prisma/client/runtime/client";
import { prisma } from "../../db/prisma";
import { CreateBudgetInput, UpdateBudgetInput } from "./budget.schema";

export async function createBudget(userId: string, data: CreateBudgetInput){

    const {category, limitAmount, periodStart} = data;

    const budget = await prisma.budget.create({
        data:{
            userId,
            category,
            limitAmount: new Decimal(limitAmount),
            periodStart: new Date(periodStart),
        }
    })

    return budget;
}

export async function listBudgets(userId:string){

    return prisma.budget.findMany({
        where: {userId},
    
    })
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