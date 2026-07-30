import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";

interface GetTransactionsParams {
  userId: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  category?: string[];
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

  const recurringIds = await getRecurringTransactionIds(userId);

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

  if (category && category.length > 0) {
    and.push(buildDetailedCategoryWhere(category, recurringIds));
  }

  const where: Prisma.TransactionWhereInput = {
    ...buildOwnershipWhere(userId),
    ...buildDateWhere(startDate, endDate),
    ...(accountId && { accountId }),
    ...(and.length > 0 && { AND: and }),
  };

  const rows = await prisma.transaction.findMany({
    where,
    orderBy: [{ date: "desc" }, { id: "desc" }], // stable order for cursor paging
    take,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }), // start after the last row sent
  });

  const nextCursor = rows.length === take ? rows[rows.length - 1].id : null;

  // Overlay the heuristic recurring flag (see getRecurringTransactionIds) —
  // the stored isRecurring column is never populated by sync today.
  const transactions = rows.map((t) => ({
    ...t,
    isRecurring: recurringIds.has(t.id),
  }));

  return { transactions, nextCursor };
}

// Single-category, primary-level match. Used only by getTransactionSummary
// (Dashboard/Budgets), which intentionally stays at the coarser primary
// category level — do not widen this without checking those callers.
function buildCategoryWhere(category: string): Prisma.TransactionWhereInput {
  // effective category = userCategory if set, else personalFinanceCategory
  return {
    OR: [
      { userCategory: category },
      { userCategory: null, personalFinanceCategory: category },
    ],
  };
}

// Multi-select, detailed-level match used by the Transactions page. Falls
// back to the primary category for older rows synced before
// personalFinanceCategoryDetail was populated. A "SUBSCRIPTION" value is a
// sentinel matched against the heuristic recurringIds set rather than a
// stored column.
function buildDetailedCategoryWhere(
  categories: string[],
  recurringIds: Set<string>,
): Prisma.TransactionWhereInput {
  const conditions: Prisma.TransactionWhereInput[] = categories.map(
    (value) => {
      if (value === "SUBSCRIPTION") {
        return { id: { in: Array.from(recurringIds) } };
      }
      return {
        OR: [
          { userCategory: value },
          { userCategory: null, personalFinanceCategoryDetail: value },
          // Primary-level fallback. Deliberately NOT conditioned on detail
          // being null — Dashboard/Budgets still send primary values (e.g.
          // "FOOD_AND_DRINK") here via TransactionFilters.category, and
          // those need to keep matching every row in that primary bucket
          // even once personalFinanceCategoryDetail is populated on newly
          // synced rows, not just old pre-detail ones.
          { userCategory: null, personalFinanceCategory: value },
        ],
      };
    },
  );

  return conditions.length > 0 ? { OR: conditions } : {};
}

const RECURRING_MIN_GAP_DAYS = 25;
const RECURRING_MAX_GAP_DAYS = 35;
const RECURRING_AMOUNT_TOLERANCE = 0.1; // 10%

// Heuristic recurring/subscription detector: flags a transaction as
// recurring if the same merchant charged the same account at least twice
// with a roughly monthly cadence and a similar amount. Plaid's dedicated
// recurring-transactions endpoint isn't wired up (isRecurring/
// recurringFrequency are never set during sync), so this is a lightweight
// stand-in computed fresh on every call. It's a full-table scan per
// request — fine at personal-app volumes, revisit if that changes.
async function getRecurringTransactionIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.transaction.findMany({
    where: buildOwnershipWhere(userId),
    select: {
      id: true,
      accountId: true,
      merchantName: true,
      name: true,
      date: true,
      amount: true,
    },
  });

  const groups = new Map<
    string,
    { id: string; date: Date; amount: number }[]
  >();

  for (const r of rows) {
    const merchantKey = (r.merchantName ?? r.name).trim().toLowerCase();
    const key = `${r.accountId}::${merchantKey}`;
    const list = groups.get(key) ?? [];
    list.push({ id: r.id, date: r.date, amount: r.amount.toNumber() });
    groups.set(key, list);
  }

  const recurringIds = new Set<string>();

  for (const occurrences of groups.values()) {
    if (occurrences.length < 2) continue;
    occurrences.sort((a, b) => a.date.getTime() - b.date.getTime());

    for (let i = 1; i < occurrences.length; i++) {
      const gapDays =
        (occurrences[i].date.getTime() - occurrences[i - 1].date.getTime()) /
        86400000;
      const amtA = Math.abs(occurrences[i - 1].amount);
      const amtB = Math.abs(occurrences[i].amount);
      const amountSimilar =
        amtA === 0
          ? amtB === 0
          : Math.abs(amtA - amtB) / amtA <= RECURRING_AMOUNT_TOLERANCE;

      if (
        gapDays >= RECURRING_MIN_GAP_DAYS &&
        gapDays <= RECURRING_MAX_GAP_DAYS &&
        amountSimilar
      ) {
        recurringIds.add(occurrences[i - 1].id);
        recurringIds.add(occurrences[i].id);
      }
    }
  }

  return recurringIds;
}

// Distinct effective categories across the user's transactions, for the
// Transactions page's category filter. Detailed-level (unlike
// getTransactionSummary's byCategory, which intentionally stays primary).
export async function getDistinctCategories(userId: string): Promise<string[]> {
  const [rows, recurringIds] = await Promise.all([
    prisma.transaction.findMany({
      where: buildOwnershipWhere(userId),
      select: {
        userCategory: true,
        personalFinanceCategoryDetail: true,
        personalFinanceCategory: true,
      },
    }),
    getRecurringTransactionIds(userId),
  ]);

  const set = new Set<string>();
  for (const r of rows) {
    const effective =
      r.userCategory ?? r.personalFinanceCategoryDetail ?? r.personalFinanceCategory;
    if (effective) set.add(effective);
  }

  const categories = Array.from(set).sort();
  if (recurringIds.size > 0) categories.push("SUBSCRIPTION");
  return categories;
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

  const recurringIds = await getRecurringTransactionIds(userId);

  return { ...transaction, isRecurring: recurringIds.has(transaction.id) };
}

export async function updateTransactionCategory(
  userId: string,
  transactionId: string,
  userCategory: string | null,
) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { account: { include: { plaidItem: true } } },
  });

  if (!transaction || transaction.account.plaidItem.userId !== userId) {
    throw Object.assign(new Error("Transaction not found"), { status: 404 });
  }

  return prisma.transaction.update({
    where: { id: transactionId },
    data: { userCategory },
  });
}

export async function getTransactionSummary(params: GetSummaryParams) {
  const { userId, startDate, endDate, accountId, category } = params;

  const baseWhere: Prisma.TransactionWhereInput = {
    ...buildOwnershipWhere(userId),
    ...buildDateWhere(startDate, endDate),
    ...(accountId && { accountId }),
    ...(category && buildCategoryWhere(category)),
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

  const incomeWhere: Prisma.TransactionWhereInput = {
    ...buildOwnershipWhere(userId),
    ...buildDateWhere(startDate, endDate),
    ...(accountId && { accountId }),
    ...(category && buildCategoryWhere(category)),
    amount: { lt: 0 },
  };

  const incomeAgg = await prisma.transaction.aggregate({
    where: incomeWhere,
    _sum: { amount: true },
  });

  const byDay = await getByDaySummary(baseWhere, incomeWhere);

  console.log(
    `[getTransactionSummary] userId=${userId} categories=${byCategory.length}`,
  );

  return {
    byCategory,
    byDay,
    totalSpent,
    totalIncome: Math.abs(incomeAgg._sum.amount?.toNumber() ?? 0),
  };
}

// Buckets spending/income transactions by calendar day for the "spending
// over time" chart. Bucketing happens in JS rather than a Prisma groupBy
// (which can't group by a truncated date expression) — fine at personal-app
// transaction volumes.
async function getByDaySummary(
  spendingWhere: Prisma.TransactionWhereInput,
  incomeWhere: Prisma.TransactionWhereInput,
): Promise<{ date: string; spending: number; income: number }[]> {
  const [spendingRows, incomeRows] = await Promise.all([
    prisma.transaction.findMany({
      where: spendingWhere,
      select: { date: true, amount: true },
    }),
    prisma.transaction.findMany({
      where: incomeWhere,
      select: { date: true, amount: true },
    }),
  ]);

  const byDate = new Map<string, { spending: number; income: number }>();

  for (const row of spendingRows) {
    const key = row.date.toISOString().slice(0, 10);
    const entry = byDate.get(key) ?? { spending: 0, income: 0 };
    entry.spending += row.amount.toNumber();
    byDate.set(key, entry);
  }

  for (const row of incomeRows) {
    const key = row.date.toISOString().slice(0, 10);
    const entry = byDate.get(key) ?? { spending: 0, income: 0 };
    entry.income += Math.abs(row.amount.toNumber());
    byDate.set(key, entry);
  }

  return Array.from(byDate.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

interface GetSummaryParams {
  userId: string;
  startDate?: string;
  endDate?: string;
  accountId?: string;
  category?: string;
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
