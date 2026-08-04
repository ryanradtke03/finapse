import { randomUUID } from "node:crypto";
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

  // Totals for the WHOLE filtered set (not just the current page), so the UI
  // can show a running total that reflects the active filters/search regardless
  // of pagination. amount is signed (positive = outflow/spend, negative =
  // inflow), so _sum.amount is the net; count is the matching row count.
  const [rows, totals] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: [{ date: "desc" }, { id: "desc" }], // stable order for cursor paging
      take,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }), // start after the last row sent
    }),
    prisma.transaction.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const nextCursor = rows.length === take ? rows[rows.length - 1].id : null;

  // Overlay the heuristic recurring flag (see getRecurringTransactionIds) —
  // the stored isRecurring column is never populated by sync today.
  const transactions = rows.map((t) => ({
    ...t,
    isRecurring: recurringIds.has(t.id),
  }));

  return {
    transactions,
    nextCursor,
    totalAmount: totals._sum.amount?.toNumber() ?? 0,
    totalCount: totals._count,
  };
}

// Detailed-level match, used by both the Transactions page (multi-select)
// and getTransactionSummary (Dashboard multi-select; Budgets passes none).
// Falls back to the primary category for older rows
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

// FIN-94: computing the recurring set is a full-table scan, and a single
// Transactions page load fires several independent requests (list, categories,
// summary), each of which would otherwise re-scan from scratch. Cache the
// result per user for a short window so those sibling requests share one scan.
//
// Per-request memoization wouldn't help — each of those is a separate HTTP
// request, not one request calling the scan repeatedly — so the cache is
// deliberately cross-request, keyed by user, with a short TTL as a staleness
// backstop. It's invalidated explicitly whenever the underlying data changes,
// which in practice is only a Plaid sync: manual transactions carry no
// personalFinanceCategory (so they're never subscription-eligible) and
// deleteTransaction only ever removes MANUAL rows, so neither can alter the
// set. In-memory + single-instance by design; a multi-instance deploy would
// move this to a shared cache.
const RECURRING_CACHE_TTL_MS = 30_000;
const recurringCache = new Map<
  string,
  { ids: Set<string>; expiresAt: number }
>();

export function invalidateRecurringCache(userId: string): void {
  recurringCache.delete(userId);
}

// Thin I/O wrapper: fetch the candidate rows from the DB, convert Prisma's
// Decimal to a plain number, hand off to the pure computeRecurringIds above.
async function getRecurringTransactionIds(userId: string): Promise<Set<string>> {
  const cached = recurringCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.ids;

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

  const ids = computeRecurringIds(
    rows.map((r) => ({ ...r, amount: r.amount.toNumber() })),
  );
  recurringCache.set(userId, {
    ids,
    expiresAt: Date.now() + RECURRING_CACHE_TTL_MS,
  });
  return ids;
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
  // Ownership is enforced via the where clause (buildOwnershipWhere joins
  // account.plaidItem.userId). We deliberately `include` only a safe subset
  // of account fields and NEVER the parent PlaidItem — that row carries the
  // encrypted Plaid access token and must not leak to the client (FIN-96).
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, ...buildOwnershipWhere(userId) },
    include: {
      account: {
        select: {
          id: true,
          name: true,
          mask: true,
          type: true,
          subtype: true,
        },
      },
    },
  });

  if (!transaction) {
    throw Object.assign(new Error("Transaction not found"), { status: 404 });
  }

  const recurringIds = await getRecurringTransactionIds(userId);

  return { ...transaction, isRecurring: recurringIds.has(transaction.id) };
}

// Stable key used to group a merchant's transactions for category rules.
// Prefer Plaid's merchant entity id (consistent across differently-formatted
// raw names); otherwise key on the transaction's merchant label — the same
// `merchantName ?? name` the UI groups and searches by, so sandbox/real rows
// that have no merchant_name (only a raw `name`) can still be ruled on.
// Returns null only when there's genuinely no label at all.
export function deriveMerchantKey(row: {
  merchantEntityId: string | null;
  merchantName: string | null;
  name: string | null;
}): string | null {
  if (row.merchantEntityId) return `entity:${row.merchantEntityId}`;
  const label = (row.merchantName ?? row.name)?.trim().toLowerCase();
  return label ? `name:${label}` : null;
}

// Translates a merchant key back into a Prisma filter matching that merchant's
// transactions. Entity-keyed rules match by merchantEntityId. Label-keyed rules
// match rows without an entity id (so a label rule can't hijack a
// differently-identified merchant) whose merchant label — merchantName, or the
// raw name when merchantName is absent — equals the key, case-insensitively.
function merchantKeyWhere(merchantKey: string): Prisma.TransactionWhereInput {
  if (merchantKey.startsWith("entity:")) {
    return { merchantEntityId: merchantKey.slice("entity:".length) };
  }
  const label = merchantKey.slice("name:".length);
  return {
    merchantEntityId: null,
    OR: [
      { merchantName: { equals: label, mode: "insensitive" } },
      {
        merchantName: null,
        name: { equals: label, mode: "insensitive" },
      },
    ],
  };
}

export interface TransactionPatch {
  userCategory?: string | null;
  notes?: string | null;
  tags?: string[];
  // When set alongside a non-null userCategory, also create/refresh a merchant
  // rule. "future" only stores the rule (applied to newly synced rows going
  // forward); "all" additionally back-fills existing rows from this merchant.
  applyToMerchant?: "future" | "all";
}

export async function updateTransaction(
  userId: string,
  transactionId: string,
  patch: TransactionPatch,
) {
  const existing = await prisma.transaction.findFirst({
    where: { id: transactionId, ...buildOwnershipWhere(userId) },
    select: { id: true, merchantEntityId: true, merchantName: true, name: true },
  });

  if (!existing) {
    throw Object.assign(new Error("Transaction not found"), { status: 404 });
  }

  // A user editing the category directly is always a MANUAL override for this
  // row; clearing it (null) resets the source too.
  const categorySourceUpdate =
    patch.userCategory !== undefined
      ? { categorySource: patch.userCategory === null ? null : "MANUAL" }
      : {};

  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      ...(patch.userCategory !== undefined && {
        userCategory: patch.userCategory,
      }),
      ...categorySourceUpdate,
      ...(patch.notes !== undefined && { notes: patch.notes }),
      ...(patch.tags !== undefined && { tags: patch.tags }),
    },
  });

  // Merchant-rule handling only applies when setting a concrete category.
  if (patch.applyToMerchant && patch.userCategory) {
    const merchantKey = deriveMerchantKey(existing);
    if (merchantKey) {
      await upsertMerchantRule(
        userId,
        merchantKey,
        patch.userCategory,
        patch.applyToMerchant === "all",
        transactionId,
      );
    }
  }

  return updated;
}

// Creates/updates the merchant rule and, when backfill is requested, applies it
// to the merchant's other transactions — skipping rows the user set MANUAL-ly
// and the just-edited row (already handled above). MERCHANT_RULE rows are
// re-written so changing a rule re-applies cleanly.
async function upsertMerchantRule(
  userId: string,
  merchantKey: string,
  category: string,
  backfill: boolean,
  originTransactionId: string,
) {
  await prisma.merchantCategoryRule.upsert({
    where: { userId_merchantKey: { userId, merchantKey } },
    create: { userId, merchantKey, category },
    update: { category },
  });

  if (!backfill) return;

  await prisma.transaction.updateMany({
    where: buildMerchantBackfillWhere(userId, merchantKey, originTransactionId),
    data: { userCategory: category, categorySource: "MERCHANT_RULE" },
  });
}

// Rows to back-fill for a merchant rule: same merchant, excluding the origin
// row, and only rows the user hasn't MANUAL-ly set (null or prior rule).
// NOTE: merchantKeyWhere can itself contain an `OR` (name-keyed rules), and so
// does the categorySource guard — they MUST be combined under `AND`, not as two
// `OR` keys in one object literal (the second would silently clobber the first,
// matching every transaction). Exported so the composition is unit-tested.
export function buildMerchantBackfillWhere(
  userId: string,
  merchantKey: string,
  originTransactionId: string,
): Prisma.TransactionWhereInput {
  return {
    ...buildOwnershipWhere(userId),
    id: { not: originTransactionId },
    AND: [
      merchantKeyWhere(merchantKey),
      { OR: [{ categorySource: null }, { categorySource: "MERCHANT_RULE" }] },
    ],
  };
}

// Applies every one of a user's merchant rules to transactions that don't yet
// have a userCategory (i.e. freshly synced rows). Called after a Plaid sync.
// Only touches rows with no override, so MANUAL and existing MERCHANT_RULE rows
// are left alone. Runs inside the caller's transaction when `client` is passed.
export async function applyMerchantRulesForUser(
  userId: string,
  client: Prisma.TransactionClient = prisma,
): Promise<void> {
  const rules = await client.merchantCategoryRule.findMany({
    where: { userId },
    select: { merchantKey: true, category: true },
  });

  for (const rule of rules) {
    await client.transaction.updateMany({
      where: {
        ...buildOwnershipWhere(userId),
        ...merchantKeyWhere(rule.merchantKey),
        userCategory: null,
      },
      data: { userCategory: rule.category, categorySource: "MERCHANT_RULE" },
    });
  }
}

export async function deleteTransaction(
  userId: string,
  transactionId: string,
) {
  const existing = await prisma.transaction.findFirst({
    where: { id: transactionId, ...buildOwnershipWhere(userId) },
    select: { id: true, source: true },
  });

  if (!existing) {
    throw Object.assign(new Error("Transaction not found"), { status: 404 });
  }

  // Synced (Plaid) rows would just reappear on the next sync, so only
  // user-entered transactions can be removed (FIN-49 / FIN-56).
  if (existing.source !== "MANUAL") {
    throw Object.assign(
      new Error("Only manually added transactions can be deleted"),
      { status: 400 },
    );
  }

  await prisma.transaction.update({
    where: { id: transactionId },
    data: { deletedAt: new Date() },
  });
}

export interface CreateTransactionInput {
  accountId: string;
  // Signed like Plaid's convention (and everything downstream): positive =
  // spending/expense, negative = income. The web form's Expense/Income toggle
  // produces the sign.
  amount: number;
  date: string;
  name: string;
  category: string;
  notes?: string | null;
  tags?: string[];
}

// Manual (non-Plaid) transaction entry (FIN-47). The account must belong to
// the user; the chosen category is stored as the user override so it wins in
// resolveEffectiveCategory just like a recategorized Plaid row.
export async function createTransaction(
  userId: string,
  input: CreateTransactionInput,
) {
  // Ownership check via the same join used everywhere else — the account has
  // to hang off one of this user's Plaid items.
  const account = await prisma.account.findFirst({
    where: { id: input.accountId, plaidItem: { userId } },
    select: { id: true },
  });

  if (!account) {
    throw Object.assign(new Error("Account not found"), { status: 404 });
  }

  const created = await prisma.transaction.create({
    data: {
      // Manual rows have no Plaid id, but the column is required + unique.
      plaidTransactionId: `manual:${randomUUID()}`,
      source: "MANUAL",
      accountId: input.accountId,
      amount: input.amount,
      date: new Date(input.date),
      name: input.name,
      userCategory: input.category,
      notes: input.notes ?? null,
      tags: input.tags ?? [],
    },
    include: {
      account: {
        select: { id: true, name: true, mask: true, type: true, subtype: true },
      },
    },
  });

  // Shape-compatible with getTransactionById; a brand-new row is never
  // flagged recurring (the heuristic needs 3+ occurrences).
  return { ...created, isRecurring: false };
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

// Plaid categories that represent money moving between the user's own accounts
// or paying down a card — NOT consumption. Excluded from Dashboard
// spending/income totals so investment/retirement contributions (a TRANSFER_OUT
// detail) and credit-card payments don't inflate the numbers. Excluding card
// payments also prevents double-counting: card purchases are already captured on
// the card account, so counting the checking->card payment too would count the
// same spending twice. These rows still appear on the Transactions list.
const NON_SPENDING_PRIMARY_CATEGORIES = ["TRANSFER_IN", "TRANSFER_OUT"];
const NON_SPENDING_DETAIL_CATEGORIES = ["LOAN_PAYMENTS_CREDIT_CARD_PAYMENT"];

// Excludes transfer/card-payment rows unless the user has explicitly
// recategorized them (userCategory override wins, matching
// resolveEffectiveCategory precedence). Exported for unit testing.
export function buildExcludeTransfersWhere(): Prisma.TransactionWhereInput {
  return {
    NOT: {
      userCategory: null,
      OR: [
        { personalFinanceCategory: { in: NON_SPENDING_PRIMARY_CATEGORIES } },
        {
          personalFinanceCategoryDetail: { in: NON_SPENDING_DETAIL_CATEGORIES },
        },
      ],
    },
  };
}

export async function getTransactionSummary(params: GetSummaryParams) {
  const { userId, startDate, endDate, accountId, category } = params;

  const recurringIds = await getRecurringTransactionIds(userId);

  // When no explicit category filter is active, drop transfers/card payments
  // so the headline totals reflect real spending. If the user explicitly
  // selects a category (even a transfer one), honor that selection instead.
  const categoryOrTransferWhere = category?.length
    ? buildDetailedCategoryWhere(category, recurringIds)
    : buildExcludeTransfersWhere();

  const baseWhere: Prisma.TransactionWhereInput = {
    ...buildOwnershipWhere(userId),
    ...buildDateWhere(startDate, endDate),
    ...(accountId && { accountId }),
    ...categoryOrTransferWhere,
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
    ...categoryOrTransferWhere,
    amount: { lt: 0 },
  };

  const incomeAgg = await prisma.transaction.aggregate({
    where: incomeWhere,
    _sum: { amount: true },
  });

  const byDay = await getByDaySummary(baseWhere, incomeWhere);

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
  category?: string[];
}

function buildOwnershipWhere(userId: string): Prisma.TransactionWhereInput {
  return {
    // Soft-deleted rows (FIN-49) are hidden everywhere lists/summaries/
    // categories/recurring detection read through this helper.
    deletedAt: null,
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
