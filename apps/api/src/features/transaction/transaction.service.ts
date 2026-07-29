import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";

interface GetTransactionsParams {
  userId: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  category?: string;
  limit?: number;
  cursor?: string;
}

export async function getTransactionsList(params: GetTransactionsParams) {
  const {
    userId,
    accountId,
    startDate,
    endDate,
    search,
    category,
    limit,
    cursor,
  } = params;

  const take = Math.min(limit ?? 20, 100); // default 20, hard cap 100

  // independent OR-groups get combined under AND so they don't clobber each other
  const and: Prisma.TransactionWhereInput[] = [];

  if (search) {
    and.push({
      OR: [
        { merchantName: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (category) {
    and.push(buildCategoryWhere(category));
  }

  const where: Prisma.TransactionWhereInput = {
    ...buildOwnershipWhere(userId),
    ...buildDateWhere(startDate, endDate),
    ...(accountId && { accountId }),
    ...(and.length > 0 && { AND: and }),
  };

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: [{ date: "desc" }, { id: "desc" }], // stable order for cursor paging
    take,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }), // start after the last row sent
  });

  const nextCursor =
    transactions.length === take
      ? transactions[transactions.length - 1].id
      : null;

  return { transactions, nextCursor };
}

function buildCategoryWhere(category: string): Prisma.TransactionWhereInput {
  // effective category = userCategory if set, else personalFinanceCategory
  return {
    OR: [
      { userCategory: category },
      { userCategory: null, personalFinanceCategory: category },
    ],
  };
}

export async function getTransactionById(
  userId: string,
  transactionId: string,
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

export async function getTransactionSummary(params: GetSummaryParams) {
  const { userId, startDate, endDate, accountId } = params;

  const baseWhere: Prisma.TransactionWhereInput = {
    ...buildOwnershipWhere(userId),
    ...buildDateWhere(startDate, endDate),
    ...(accountId && { accountId }),
    amount: { gt: 0 },
  };

  const withOverride = await prisma.transaction.groupBy({
    by: ["userCategory"],
    where: { ...baseWhere, userCategory: { not: null } },
    _sum: { amount: true },
    _count: { id: true },
  });

  const withPlaid = await prisma.transaction.groupBy({
    by: ["personalFinanceCategory"],
    where: { ...baseWhere, userCategory: null },
    _sum: { amount: true },
    _count: { id: true },
  });

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
    `[getTransactionSummary] userId=${userId} categories=${byCategory.length}`,
  );

  return {
    byCategory,
    totalSpent,
    totalIncome: Math.abs(incomeAgg._sum.amount?.toNumber() ?? 0),
  };
}

interface GetSummaryParams {
  userId: string;
  startDate?: string;
  endDate?: string;
  accountId?: string;
}

function buildOwnershipWhere(userId: string): Prisma.TransactionWhereInput {
  return {
    account: {
      plaidItem: { userId },
    },
  };
}

function buildDateWhere(
  startDate?: string,
  endDate?: string,
): Prisma.TransactionWhereInput {
  if (!startDate && !endDate) return {};
  return {
    date: {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    },
  };
}
