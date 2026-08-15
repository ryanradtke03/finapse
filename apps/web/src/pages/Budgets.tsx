import { useState } from "react";
import type { Budget } from "../api/budgets";
import { BudgetModal } from "../components/BudgetModal";
import {
  useBudgets,
  useCopyBudgets,
  useCreateBudget,
  useDeleteBudget,
  useUpdateBudget,
} from "../hooks/useBudgets";
import {
  getTransactionCategoryColor,
  getTransactionCategoryLabel,
  isCustomCategory,
} from "../lib/transactionCategories";
import {
  useTransactionCategories,
  useTransactionSummary,
} from "../hooks/useTransactions";
import logger from "../utils/logger";

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <path d="M7 1v12M1 7h12" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 2l3 3-8 8-3.5 1 1-3.5 8-8z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 4h12M5 4V2h4l1 2M3 4l1 10h6l1-10" />
    </svg>
  );
}

function ChevronIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={dir === "left" ? "M10 3L5 8l5 5" : "M6 3l5 5-5 5"} />
    </svg>
  );
}

// First of a month as YYYY-MM-01 (matches how budgets store periodStart).
function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

// Last day of a month as YYYY-MM-DD (for the spend-summary end date).
function monthEndKey(d: Date): string {
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
}

function monthLabelOf(d: Date): string {
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

// <80% green, 80-100% amber, >100% red (over budget)
function usageColor(percent: number): { bar: string; text: string } {
  if (percent > 100) return { bar: "bg-brand-error", text: "text-brand-error" };
  if (percent >= 80) return { bar: "bg-brand-warning", text: "text-brand-warning" };
  return { bar: "bg-brand-green", text: "text-brand-green" };
}

export default function Budgets() {
  // Which month is being viewed (first of the month). Budgets and spend are
  // scoped to it; the ◀ ▶ nav moves between months.
  const [selectedMonth, setSelectedMonth] = useState(() =>
    addMonths(new Date(), 0),
  );
  const periodStart = monthKey(selectedMonth);
  const prevMonth = addMonths(selectedMonth, -1);

  const budgetsQuery = useBudgets(periodStart);
  const summaryQuery = useTransactionSummary({
    startDate: periodStart,
    endDate: monthEndKey(selectedMonth),
  });
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const deleteMutation = useDeleteBudget();
  const copyMutation = useCopyBudgets();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [prefillCategory, setPrefillCategory] = useState<string | undefined>();
  const [copyError, setCopyError] = useState("");

  // Custom categories the user has already created (on transactions or on
  // this month's budgets), surfaced in the picker for reuse so "Kids" doesn't
  // have to be retyped every month.
  const categoriesQuery = useTransactionCategories();
  const customCategories = Array.from(
    new Set(
      [
        ...(categoriesQuery.data ?? []),
        ...(budgetsQuery.data ?? []).map((b) => b.category),
      ].filter(isCustomCategory),
    ),
  ).map((value) => ({ value, label: getTransactionCategoryLabel(value) }));

  // byCategory rows are keyed by detailed category. A budget stored at the
  // primary level (e.g. old budgets created before this was detailed, or
  // just "FOOD_AND_DRINK" as a broad catch-all) needs every detailed row
  // under that bucket summed, not a single exact-key lookup — mirrors the
  // backend's buildDetailedCategoryWhere primary-fallback semantics.
  const byCategoryRows = summaryQuery.data?.byCategory ?? [];
  function spentForCategory(budgetCategory: string): number {
    return byCategoryRows
      .filter(
        (row) =>
          row.category === budgetCategory ||
          row.category.startsWith(`${budgetCategory}_`),
      )
      .reduce((sum, row) => sum + row.total, 0);
  }

  const budgets = budgetsQuery.data ?? [];
  const totalBudgeted = budgets.reduce((sum, b) => sum + Number(b.limitAmount), 0);
  const totalSpent = summaryQuery.data?.totalSpent ?? 0;
  const overallPercent = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const remaining = totalBudgeted - totalSpent;
  const overallColor = usageColor(overallPercent);

  // Month pacing: how far through the selected month we are (0..1). Only
  // meaningful for the current month — past months are fully elapsed, future
  // ones haven't started. Drives the "you should be ~here" marker on the bars.
  const now = new Date();
  const isCurrentMonth =
    now.getFullYear() === selectedMonth.getFullYear() &&
    now.getMonth() === selectedMonth.getMonth();
  const daysInSelectedMonth = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() + 1,
    0,
  ).getDate();
  const monthProgress = isCurrentMonth ? now.getDate() / daysInSelectedMonth : 1;

  // At-risk first: sort budgets by % used descending so anything over/near
  // limit floats to the top.
  const budgetRows = budgets
    .map((b) => {
      const spent = spentForCategory(b.category);
      const limit = Number(b.limitAmount);
      const percent = limit > 0 ? (spent / limit) * 100 : 0;
      return { b, spent, limit, percent };
    })
    .sort((a, z) => z.percent - a.percent);

  // Spending in categories with no budget (not covered by any budget's exact
  // or primary-level match). Biggest first.
  const unbudgetedRows = byCategoryRows
    .filter(
      (row) =>
        !budgets.some(
          (b) =>
            row.category === b.category ||
            row.category.startsWith(`${b.category}_`),
        ),
    )
    .sort((a, z) => z.total - a.total);
  const unbudgetedTotal = unbudgetedRows.reduce((sum, r) => sum + r.total, 0);

  const openCreate = (prefill?: string) => {
    setEditing(null);
    setPrefillCategory(prefill);
    setModalOpen(true);
  };

  const openEdit = (budget: Budget) => {
    setEditing(budget);
    setModalOpen(true);
  };

  const handleSubmit = async (data: { category: string; limitAmount: string }) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data });
    } else {
      await createMutation.mutateAsync({ ...data, periodStart });
    }
  };

  const handleDelete = async (budget: Budget) => {
    if (!confirm(`Delete the "${getTransactionCategoryLabel(budget.category)}" budget?`))
      return;
    try {
      await deleteMutation.mutateAsync(budget.id);
    } catch (err) {
      logger.error("Delete budget failed", { err: String(err) });
    }
  };

  const handleCopyForward = async () => {
    setCopyError("");
    try {
      const { copied } = await copyMutation.mutateAsync({
        from: monthKey(prevMonth),
        to: periodStart,
      });
      if (copied === 0) {
        setCopyError(`No budgets in ${monthLabelOf(prevMonth)} to copy.`);
      }
    } catch (err) {
      logger.error("Copy budgets failed", { err: String(err) });
      setCopyError("Couldn't copy budgets. Try again.");
    }
  };

  return (
    <div>
      {budgetsQuery.isLoading && (
        <p className="text-brand-text-secondary">Loading…</p>
      )}
      {budgetsQuery.isError && (
        <p className="text-brand-error">Couldn't load budgets.</p>
      )}

      {!budgetsQuery.isLoading && !budgetsQuery.isError && (
        <>
          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedMonth((m) => addMonths(m, -1))}
              aria-label="Previous month"
              className="cursor-pointer rounded-lg border border-brand-border-subtle p-1.5 text-brand-text-secondary transition-colors duration-150 hover:border-brand-border hover:text-brand-text"
            >
              <ChevronIcon dir="left" />
            </button>
            <span className="min-w-[10rem] text-center text-lg font-semibold text-brand-text">
              {monthLabelOf(selectedMonth)}
            </span>
            <button
              type="button"
              onClick={() => setSelectedMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
              className="cursor-pointer rounded-lg border border-brand-border-subtle p-1.5 text-brand-text-secondary transition-colors duration-150 hover:border-brand-border hover:text-brand-text"
            >
              <ChevronIcon dir="right" />
            </button>
          </div>

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1 rounded-xl border border-brand-border bg-brand-surface p-5">
              <p className="text-xs tracking-wide text-brand-text-secondary uppercase">
                {monthLabelOf(selectedMonth)}
              </p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
                <div>
                  <span className="text-3xl font-bold text-brand-text">
                    ${totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span className="ml-2 text-sm text-brand-text-secondary">
                    spent of ${totalBudgeted.toLocaleString(undefined, { maximumFractionDigits: 0 })} budgeted
                  </span>
                </div>
                <div className="flex-1">
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-brand-border-subtle">
                    <div
                      className={`h-full rounded-full ${overallColor.bar}`}
                      style={{ width: `${Math.min(overallPercent, 100)}%` }}
                    />
                    {isCurrentMonth && (
                      <div
                        className="absolute top-0 h-full w-0.5 bg-white/60"
                        style={{ left: `${monthProgress * 100}%` }}
                        title="Where you should be today"
                      />
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-brand-text-secondary">
                    {Math.round(overallPercent)}% used ·{" "}
                    {remaining >= 0
                      ? `$${remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} remaining`
                      : `over by $${Math.abs(remaining).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    {isCurrentMonth &&
                      ` · day ${now.getDate()} of ${daysInSelectedMonth}`}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openCreate()}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-brand-green px-4 py-2.5 text-sm font-semibold text-brand-bg transition-colors duration-200 hover:bg-brand-green-hover"
            >
              <PlusIcon />
              Create budget
            </button>
          </div>

          {budgets.length === 0 && (
            <div className="rounded-xl border border-brand-border bg-brand-surface p-8 text-center">
              <p className="text-brand-text-secondary">
                No budgets for {monthLabelOf(selectedMonth)}.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyForward}
                  disabled={copyMutation.isPending}
                  className="cursor-pointer rounded-lg border border-brand-border-subtle px-4 py-2 text-sm font-medium text-brand-text transition-colors duration-200 hover:border-brand-border disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {copyMutation.isPending
                    ? "Copying…"
                    : `Copy ${monthLabelOf(prevMonth)}'s budgets`}
                </button>
                <button
                  type="button"
                  onClick={() => openCreate()}
                  className="cursor-pointer rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-brand-bg transition-colors duration-200 hover:bg-brand-green-hover"
                >
                  Create budget
                </button>
              </div>
              {copyError && (
                <p className="mt-3 text-xs text-brand-error">{copyError}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {budgetRows.map(({ b, spent, limit, percent }) => {
              const over = spent - limit;
              const left = limit - spent;
              const color = usageColor(percent);

              return (
                <div
                  key={b.id}
                  className="rounded-xl border border-brand-border bg-brand-surface p-5"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="flex items-center gap-2 font-semibold text-brand-text">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: getTransactionCategoryColor(b.category) }}
                      />
                      {getTransactionCategoryLabel(b.category)}
                    </h3>
                    <div className="flex items-center gap-3 text-brand-text-secondary">
                      <button
                        type="button"
                        onClick={() => openEdit(b)}
                        title="Edit budget"
                        className="cursor-pointer transition-colors duration-150 hover:text-brand-text"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(b)}
                        title="Delete budget"
                        className="cursor-pointer transition-colors duration-150 hover:text-brand-error"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-block rounded-full bg-brand-surface-raised px-2.5 py-0.5 text-xs text-brand-text-secondary">
                      Monthly
                    </span>
                    {percent > 100 ? (
                      <span className="rounded-full bg-brand-error-bg px-2.5 py-0.5 text-xs font-medium text-brand-error">
                        Over budget
                      </span>
                    ) : percent >= 80 ? (
                      <span className="rounded-full bg-brand-surface-raised px-2.5 py-0.5 text-xs font-medium text-brand-warning">
                        Near limit
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-3">
                    <span className={`text-xl font-bold ${color.text}`}>
                      ${spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-sm text-brand-text-secondary">
                      {" "}
                      / ${limit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </p>

                  <div className="relative mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-border-subtle">
                    <div
                      className={`h-full rounded-full ${color.bar}`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                    {isCurrentMonth && (
                      <div
                        className="absolute top-0 h-full w-0.5 bg-white/60"
                        style={{ left: `${monthProgress * 100}%` }}
                        title="Where you should be today"
                      />
                    )}
                  </div>

                  <p className={`mt-1.5 text-xs ${percent > 100 ? "text-brand-error" : "text-brand-text-secondary"}`}>
                    {percent > 100
                      ? `${Math.round(percent)}% · over by $${over.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                      : `${Math.round(percent)}% used · $${left.toLocaleString(undefined, { maximumFractionDigits: 0 })} left`}
                  </p>
                </div>
              );
            })}
          </div>

          {unbudgetedTotal > 0 && (
            <div className="mt-4 rounded-xl border border-brand-border bg-brand-surface p-5">
              <p className="text-xs tracking-wide text-brand-text-secondary uppercase">
                Unbudgeted spending
              </p>
              <p className="mt-1 text-2xl font-bold text-brand-text">
                ${unbudgetedTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="mt-0.5 text-xs text-brand-text-secondary">
                Spent in {unbudgetedRows.length} categor
                {unbudgetedRows.length === 1 ? "y" : "ies"} with no budget
              </p>

              <div className="mt-4 flex flex-col divide-y divide-brand-border-subtle">
                {unbudgetedRows.slice(0, 5).map((row) => (
                  <div
                    key={row.category}
                    className="flex items-center justify-between gap-4 py-2.5"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm text-brand-text">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: getTransactionCategoryColor(row.category) }}
                      />
                      <span className="truncate">
                        {getTransactionCategoryLabel(row.category)}
                      </span>
                    </span>
                    <div className="flex shrink-0 items-center gap-4">
                      <span className="text-sm font-medium text-brand-text">
                        ${row.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <button
                        type="button"
                        onClick={() => openCreate(row.category)}
                        className="cursor-pointer rounded-lg border border-brand-border-subtle px-3 py-1 text-xs font-medium text-brand-text transition-colors duration-150 hover:border-brand-border hover:text-brand-green"
                      >
                        Budget it
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <BudgetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        defaultCategory={prefillCategory}
        customCategories={customCategories}
      />
    </div>
  );
}
