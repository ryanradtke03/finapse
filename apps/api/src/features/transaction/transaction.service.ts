import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface GetTransactionsParams {
  userId: string;
  startDate?: string;
  endDate?: string;
  accountId?: string;
  limit?: number;
  cursor?: string; // transactionId to paginate from
}

interface GetSummaryParams {
  userId: string;
  startDate?: string;
  endDate?: string;
  accountId?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function buildOwnershipWhere(userId: string): Prisma.TransactionWhereInput {
  return {
    account: {
      plaidItem: { userId },
    },
  };
}

function buildDateWhere(
  startDate?: string,
  endDate?: string
): Prisma.TransactionWhereInput {
  if (!startDate && !endDate) return {};
  return {
    date: {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    },
  };
}

// ─── Service Functions ─────────────────────────────────────────────────────────

/**
 * Returns a paginated, filtered list of transactions for a user.
 * Supports filtering by date range and account, and cursor-based pagination.
 */
export async function getTransactionsList(params: GetTransactionsParams) {
  const { userId, startDate, endDate, accountId, limit = 50, cursor } = params;

  const where: Prisma.TransactionWhereInput = {
    ...buildOwnershipWhere(userId),
    ...buildDateWhere(startDate, endDate),
    ...(accountId && { accountId }),
  };

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
    take: limit + 1, // Fetch one extra to determine if there's a next page
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // Skip the cursor itself
    }),
  });

  // Check if there's a next page and strip the extra record
  const hasNextPage = transactions.length > limit;
  const data = hasNextPage ? transactions.slice(0, limit) : transactions;
  const nextCursor = hasNextPage ? data[data.length - 1].id : null;

  return {
    transactions: data,
    nextCursor,
    hasNextPage,
  };
}

/**
 * Returns a single transaction by ID, scoped to the authenticated user.
 * Throws a 404 if the transaction doesn't exist or belongs to another user.
 */
export async function getTransactionById(
  userId: string,
  transactionId: string
) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      account: {
        include: {
          plaidItem: true,
        },
      },
    },
  });

  if (!transaction || transaction.account.plaidItem.userId !== userId) {
    throw Object.assign(new Error("Transaction not found"), { status: 404 });
  }

  return transaction;
}

/**
 * Returns a spending/income summary grouped by category.
 * Merges user-overridden categories with Plaid's default categorization.
 */
export async function getTransactionSummary(params: GetSummaryParams) {
  const { userId, startDate, endDate, accountId } = params;

  const baseWhere: Prisma.TransactionWhereInput = {
    ...buildOwnershipWhere(userId),
    ...buildDateWhere(startDate, endDate),
    ...(accountId && { accountId }),
    amount: { gt: 0 },
  };

  // Transactions where the user has manually set a category
  const withOverride = await prisma.transaction.groupBy({
    by: ["userCategory"],
    where: { ...baseWhere, userCategory: { not: null } },
    _sum: { amount: true },
    _count: { id: true },
  });

  // Transactions using Plaid's auto-assigned category
  const withPlaid = await prisma.transaction.groupBy({
    by: ["personalFinanceCategory"],
    where: { ...baseWhere, userCategory: null },
    _sum: { amount: true },
    _count: { id: true },
  });

  // Merge both category sources into a single map, summing overlaps
  const merged = new Map<string, { total: number; count: number }>();

  for (const row of withOverride) {
    const key = row.userCategory ?? "UNCATEGORIZED";
    merged.set(key, {
      total: row._sum.amount?.toNumber() ?? 0,
      count: row._count.id,
    });
  }

  for (const row of withPlaid) {
    const key = row.personalFinanceCategory ?? "UNCATEGORIZED";
    const existing = merged.get(key);
    merged.set(key, {
      total: (existing?.total ?? 0) + (row._sum.amount?.toNumber() ?? 0),
      count: (existing?.count ?? 0) + row._count.id,
    });
  }

  const byCategory = Array.from(merged.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.total - a.total);

  const totalSpent = byCategory.reduce((sum, row) => sum + row.total, 0);

  // Income = negative amounts (money coming in via Plaid's convention)
  const incomeAgg = await prisma.transaction.aggregate({
    where: {
      ...buildOwnershipWhere(userId),
      ...buildDateWhere(startDate, endDate),
      ...(accountId && { accountId }),
      amount: { lt: 0 },
    },
    _sum: { amount: true },
  });

  console.log(
    `[getTransactionSummary] userId=${userId} categories=${byCategory.length}`
  );

  return {
    byCategory,
    totalSpent,
    totalIncome: Math.abs(incomeAgg._sum.amount?.toNumber() ?? 0),
  };
}