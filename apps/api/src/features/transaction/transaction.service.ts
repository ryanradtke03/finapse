import { prisma } from "../../db/prisma";
import { Prisma } from "@prisma/client";

export async function getTransactionsList(userId: string) {
    return prisma.transaction.findMany({
        where: {
            account: {
                plaidItem: {
                    userId,
                }
            }
        },
    });
}

export async function getTransactionById(userId: string, transactionId: string) {
    const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
            account: {
                include: {
                    plaidItem: true,
                }
            }
        }
    });
    
    if (!transaction || transaction.account.plaidItem.userId !== userId) {
        throw Object.assign(new Error("Transaction not found"), { status: 404 });
    }
    return transaction;
}

export async function getTransactionSummary(params: GetSummaryParams) {
  const { userId, startDate, endDate, accountId } = params

  const baseWhere: Prisma.TransactionWhereInput = {
    ...buildOwnershipWhere(userId),
    ...buildDateWhere(startDate, endDate),
    ...(accountId && { accountId }),
    amount: { gt: 0 }
  }

  const withOverride = await prisma.transaction.groupBy({
    by: ['userCategory'],
    where: { ...baseWhere, userCategory: { not: null } },
    _sum: { amount: true },
    _count: { id: true }
  })

  const withPlaid = await prisma.transaction.groupBy({
    by: ['personalFinanceCategory'],
    where: { ...baseWhere, userCategory: null },
    _sum: { amount: true },
    _count: { id: true }
  })

  const merged = new Map<string, { total: number; count: number }>()

  for (const row of withOverride) {
    const key = row.userCategory ?? 'UNCATEGORIZED'
    merged.set(key, {
      total: row._sum.amount?.toNumber() ?? 0,
      count: row._count.id
    })
  }

  for (const row of withPlaid) {
    const key = row.personalFinanceCategory ?? 'UNCATEGORIZED'
    const existing = merged.get(key)
    merged.set(key, {
      total: (existing?.total ?? 0) + (row._sum.amount?.toNumber() ?? 0),
      count: (existing?.count ?? 0) + row._count.id
    })
  }

  const byCategory = Array.from(merged.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.total - a.total)

  const totalSpent = byCategory.reduce((sum, row) => sum + row.total, 0)

  const incomeAgg = await prisma.transaction.aggregate({
    where: {
      ...buildOwnershipWhere(userId),
      ...buildDateWhere(startDate, endDate),
      ...(accountId && { accountId }),
      amount: { lt: 0 }
    },
    _sum: { amount: true }
  })

  console.log(`[getTransactionSummary] userId=${userId} categories=${byCategory.length}`)

  return {
    byCategory,
    totalSpent,
    totalIncome: Math.abs(incomeAgg._sum.amount?.toNumber() ?? 0)
  }
}

interface GetSummaryParams {
  userId: string
  startDate?: string
  endDate?: string
  accountId?: string
}

function buildOwnershipWhere(userId: string): Prisma.TransactionWhereInput {
  return {
    account: {
      plaidItem: { userId }
    }
  }
}

function buildDateWhere(startDate?: string, endDate?: string): Prisma.TransactionWhereInput {
  if (!startDate && !endDate) return {}
  return {
    date: {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) })
    }
  }
}