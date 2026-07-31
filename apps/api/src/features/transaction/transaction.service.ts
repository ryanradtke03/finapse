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

// Detailed-level match, used by both the Transactions page (multi-select)
// and getTransactionSummary (Dashboard/Budgets, single value wrapped in a
// 1-element array). Falls back to the primary category for older rows
// synced before personalFinanceCategoryDetail was populated, AND for
// Budget.category values stored back when budgets were primary-level only
// (e.g. "FOOD_AND_DRINK") — the primary-column branch below matches every
// detailed row under that bucket, so old budgets keep working unchanged. A
// "SUBSCRIPTION" value is a sentinel matched against the heuristic
// recurringIds set rather than a stored column.
//
// Exported (rather than module-private) purely so it can be unit tested
// without a live DB — it just builds a plain WhereInput object, no I/O.
export function buildDetailedCategoryWhere(
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
const RECURRING_AMOUNT_TOLERANCE = 0.03; // 3% — real subscriptions charge the same amount every cycle; this only covers tax/FX rounding, not "roughly similar" purchases.

// Categories where recurring billing is actually plausible. Dining,
// transportation, travel, general merchandise, bank fees, etc. are
// inherently one-off/variable purchases — even if a coincidence makes two or
// three of them land ~monthly apart for a similar amount (common with Plaid
// Sandbox's small, repetitive set of synthetic merchants), that's not good
// evidence of a subscription. Checked against personalFinanceCategory
// (primary level, always populated) rather than the detailed column, so this
// works the same on old and new transactions regardless of backfill status.
const SUBSCRIPTION_ELIGIBLE_CATEGORIES = new Set([
  "RENT_AND_UTILITIES",
  "ENTERTAINMENT",
  "GENERAL_SERVICES",
  "PERSONAL_CARE",
]);

// One row's worth of input to the recurring-detection heuristic. Deliberately
// plain (amount: number, not Prisma.Decimal) so computeRecurringIds has no
// dependency on Prisma and can be unit tested with hand-built fixtures — see
// __tests__/recurring-detection.test.ts.
export interface RecurringCandidateRow {
  id: string;
  accountId: string;
  merchantName: string | null;
  name: string;
  date: Date;
  amount: number;
  personalFinanceCategory: string | null;
}

// Heuristic recurring/subscription detector: flags a transaction as
// recurring if the same merchant charged the same account at least THREE
// times with a roughly monthly cadence and a similar amount each time, in a
// category where recurring billing is plausible. Plaid's dedicated
// recurring-transactions endpoint isn't wired up (isRecurring/
// recurringFrequency are never set during sync), so this is a lightweight
// stand-in.
//
// Originally only required TWO occurrences (a single qualifying gap), which
// flagged way too much as "Subscription" — two one-off purchases from the
// same merchant, a month apart, for a similar amount, happen by pure
// coincidence often enough (especially with Plaid Sandbox's small,
// repetitive set of synthetic merchants/amounts) that a lone matching pair
// isn't good evidence of an actual subscription. Requiring a THIRD charge
// that continues the same cadence — i.e. two consecutive qualifying gaps
// chained together, not just one isolated pair — cuts out most of that
// false-positive noise while still catching real monthly billing.
export function computeRecurringIds(rows: RecurringCandidateRow[]): Set<string> {
  const groups = new Map<
    string,
    { id: string; date: Date; amount: number }[]
  >();

  for (const r of rows) {
    // Same account required (accountId is part of the key below) — a Chase
    // transaction and a BofA transaction can never land in the same group,
    // no matter how similar. Also gated on category: see
    // SUBSCRIPTION_ELIGIBLE_CATEGORIES above.
    if (!r.personalFinanceCategory || !SUBSCRIPTION_ELIGIBLE_CATEGORIES.has(r.personalFinanceCategory)) {
      continue;
    }

    const merchantKey = (r.merchantName ?? r.name).trim().toLowerCase();
    const key = `${r.accountId}::${merchantKey}`;
    const list = groups.get(key) ?? [];
    list.push({ id: r.id, date: r.date, amount: r.amount });
    groups.set(key, list);
  }

  const recurringIds = new Set<string>();

  for (const occurrences of groups.values()) {
    if (occurrences.length < 3) continue; // need 2 consecutive qualifying gaps => 3 occurrences minimum
    occurrences.sort((a, b) => a.date.getTime() - b.date.getTime());

    // pairQualifies[i] = does the gap between occurrences[i-1] and
    // occurrences[i] look like consecutive subscription charges (index 0 is
    // unused — there's no pair before the first occurrence).
    const pairQualifies: boolean[] = new Array(occurrences.length).fill(false);
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

      pairQualifies[i] =
        gapDays >= RECURRING_MIN_GAP_DAYS &&
        gapDays <= RECURRING_MAX_GAP_DAYS &&
        amountSimilar;
    }

    // Flag occurrences that sit inside a run of at least 2 consecutive
    // qualifying pairs (3+ chained occurrences). A single isolated
    // qualifying pair (run length 1) is left unflagged.
    let i = 1;
    while (i < occurrences.length) {
      if (!pairQualifies[i]) {
        i++;
        continue;
      }
      const runStart = i;
      while (i < occurrences.length && pairQualifies[i]) i++;
      const runEnd = i - 1;

      if (runEnd - runStart + 1 >= 2) {
        for (let occIdx = runStart - 1; occIdx <= runEnd; occIdx++) {
          recurringIds.add(occurrences[occIdx].id);
        }
      }
    }
  }

  return recurringIds;
}

// Thin I/O wrapper: fetch the candidate rows from the DB, convert Prisma's
// Decimal to a plain number, hand off to the pure computeRecurringIds above.
// It's a full-table scan per request — fine at personal-app volumes, revisit
// if that changes (see FIN-94).
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
      personalFinanceCategory: true,
    },
  });

  return computeRecurringIds(rows.map((r) => ({ ...r, amount: r.amount.toNumber() })));
}

// Distinct effective categories across the user's transactions, for the
// Transactions page's category filter. Detailed-level, same as
// getTransactionSummary's byCategory.
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

// Effective category for one row, mirroring the frontend's
// getEffectiveCategory (transactionCategories.ts) so Dashboard/Budgets group
// spending the same way Transactions displays it: an explicit user override
// always wins, then the recurring/subscription heuristic, then Plaid's
// detailed category, then its primary category.
export function resolveEffectiveCategory(
  row: {
    id: string;
    userCategory: string | null;
    personalFinanceCategoryDetail: string | null;
    personalFinanceCategory: string | null;
  },
  recurringIds: Set<string>,
): string {
  if (row.userCategory) return row.userCategory;
  if (recurringIds.has(row.id)) return "SUBSCRIPTION";
  return (
    row.personalFinanceCategoryDetail ?? row.personalFinanceCategory ?? "UNCATEGORIZED"
  );
}

export async function getTransactionSummary(params: GetSummaryParams) {
  const { userId, startDate, endDate, accountId, category } = params;

  const recurringIds = await getRecurringTransactionIds(userId);

  const baseWhere: Prisma.TransactionWhereInput = {
    ...buildOwnershipWhere(userId),
    ...buildDateWhere(startDate, endDate),
    ...(accountId && { accountId }),
    ...(category && buildDetailedCategoryWhere([category], recurringIds)),
    amount: { gt: 0 },
  };

  // Aggregated in JS rather than a Prisma groupBy — grouping by the
  // *effective* category (override > subscription heuristic > detail >
  // primary) isn't expressible as a single SQL groupBy since the heuristic
  // lives outside the DB. Fine at personal-app transaction volumes, same
  // tradeoff as getByDaySummary below.
  const spendingRows = await prisma.transaction.findMany({
    where: baseWhere,
    select: {
      id: true,
      amount: true,
      userCategory: true,
      personalFinanceCategoryDetail: true,
      personalFinanceCategory: true,
    },
  });

  const merged = new Map<string, { total: number; count: number }>();
  for (const row of spendingRows) {
    const key = resolveEffectiveCategory(row, recurringIds);
    const existing = merged.get(key);
    merged.set(key, {
      total: (existing?.total ?? 0) + row.amount.toNumber(),
      count: (existing?.count ?? 0) + 1,
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
    ...(category && buildDetailedCategoryWhere([category], recurringIds)),
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
