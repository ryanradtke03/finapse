import { useState } from "react";
import type { Budget } from "../api/budgets";
import { BudgetModal } from "../components/BudgetModal";
import {
  useBudgets,
  useCreateBudget,
  useDeleteBudget,
  useUpdateBudget,
} from "../hooks/useBudgets";
import {
  getTransactionCategoryColor,
  getTransactionCategoryLabel,
} from "../lib/transactionCategories";
import { useTransactionSummary } from "../hooks/useTransactions";
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

function firstOfMonthISO(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthLabel(): string {
  return new Date().toLocaleString("en-US", { month: "long" }).toUpperCase();
}

// <80% green, 80-100% amber, >100% red (over budget)
function usageColor(percent: number): { bar: string; text: string } {
  if (percent > 100) return { bar: "bg-brand-error", text: "text-brand-error" };
  if (percent >= 80) return { bar: "bg-brand-warning", text: "text-brand-warning" };
  return { bar: "bg-brand-green", text: "text-brand-green" };
}

export default function Budgets() {
  const budgetsQuery = useBudgets();
  const summaryQuery = useTransactionSummary({
    startDate: firstOfMonthISO(),
    endDate: todayISO(),
  });
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const deleteMutation = useDeleteBudget();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);

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

  const openCreate = () => {
    setEditing(null);
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
      await createMutation.mutateAsync({ ...data, periodStart: firstOfMonthISO() });
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
          <div className="mb-6 flex items-center gap-4">
            <div className="flex-1 rounded-xl border border-brand-border bg-brand-surface p-5">
              <p className="text-xs tracking-wide text-brand-text-secondary uppercase">
                This month · {monthLabel()}
              </p>
              <div className="mt-2 flex items-end justify-between gap-8">
                <div>
                  <span className="text-3xl font-bold text-brand-text">
                    ${totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span className="ml-2 text-sm text-brand-text-secondary">
                    spent of ${totalBudgeted.toLocaleString(undefined, { maximumFractionDigits: 0 })} budgeted
                  </span>
                </div>
                <div className="flex-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-brand-border-subtle">
                    <div
                      className={`h-full rounded-full ${overallColor.bar}`}
                      style={{ width: `${Math.min(overallPercent, 100)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-brand-text-secondary">
                    {Math.round(overallPercent)}% used ·{" "}
                    {remaining >= 0
                      ? `$${remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} remaining`
                      : `over by $${Math.abs(remaining).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-brand-green px-4 py-2.5 text-sm font-semibold text-brand-bg transition-colors duration-200 hover:bg-brand-green-hover"
            >
              <PlusIcon />
              Create budget
            </button>
          </div>

          {budgets.length === 0 && (
            <p className="text-brand-text-secondary">No budgets yet.</p>
          )}

          <div className="grid grid-cols-3 gap-4">
            {budgets.map((b) => {
              const spent = spentForCategory(b.category);
              const limit = Number(b.limitAmount);
              const percent = limit > 0 ? (spent / limit) * 100 : 0;
              const over = spent - limit;
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

                  <span className="mt-2 inline-block rounded-full bg-brand-surface-raised px-2.5 py-0.5 text-xs text-brand-text-secondary">
                    Monthly
                  </span>

                  <p className="mt-3">
                    <span className={`text-xl font-bold ${color.text}`}>
                      ${spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-sm text-brand-text-secondary">
                      {" "}
                      / ${limit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </p>

                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-border-subtle">
                    <div
                      className={`h-full rounded-full ${color.bar}`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>

                  <p className={`mt-1.5 text-xs ${percent > 100 ? "text-brand-error" : "text-brand-text-secondary"}`}>
                    {percent > 100
                      ? `${Math.round(percent)}% - over by $${over.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                      : `${Math.round(percent)}% used`}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}

      <BudgetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
      />
    </div>
  );
}
