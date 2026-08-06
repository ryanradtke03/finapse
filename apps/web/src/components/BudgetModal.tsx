import { useMemo, useState } from "react";
import type { Budget } from "../api/budgets";
import { BUDGET_CATEGORIES } from "../lib/budgetCategories";
import {
  getPrimaryCategory,
  getTransactionCategoryLabel,
} from "../lib/transactionCategories";
import { CategorySelect, type CategoryOption } from "./ui/CategorySelect";

interface BudgetModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { category: string; limitAmount: string }) => Promise<void>;
  initial?: Budget | null;
  /** Prefill the category when creating a new budget (e.g. from "Budget it"). */
  defaultCategory?: string;
  /** The user's existing custom categories, surfaced for reuse (FIN-90). */
  customCategories?: CategoryOption[];
}

export function BudgetModal({
  open,
  onClose,
  onSubmit,
  initial,
  defaultCategory,
  customCategories,
}: BudgetModalProps) {
  const [category, setCategory] = useState(
    initial?.category ?? defaultCategory ?? "",
  );
  const [limitAmount, setLimitAmount] = useState(
    initial ? String(initial.limitAmount) : "",
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  // Grouped once — same list every render, just bucketed by group for
  // <optgroup> so the ~90 detailed categories are actually scannable. Each
  // group also gets a broad "All {group}" option (the primary category) at the
  // top, mirroring the grouped category filter on Dashboard/Transactions — so a
  // budget can target a whole bucket (e.g. all of Food & Drink), not just one
  // subcategory. Primary-level budgets already sum every detailed row under
  // them on the backend + Budgets page.
  const groupedCategories = useMemo(() => {
    const groups = new Map<string, { value: string; label: string }[]>();
    for (const c of BUDGET_CATEGORIES) {
      const list = groups.get(c.group) ?? [];
      list.push({ value: c.value, label: getTransactionCategoryLabel(c.value) });
      groups.set(c.group, list);
    }
    return Array.from(groups.entries()).map(([group, items]) => {
      const primary = getPrimaryCategory(items[0]?.value ?? "");
      const list =
        primary && !items.some((i) => i.value === primary)
          ? [{ value: primary, label: `All ${group}` }, ...items]
          : items;
      return [group, list] as [string, { value: string; label: string }[]];
    });
  }, []);

  // Reset form fields to `initial` each time the modal opens (render-time
  // state adjustment, not an effect — see AuthModal for the same pattern).
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setCategory(initial?.category ?? defaultCategory ?? "");
      setLimitAmount(initial ? String(initial.limitAmount) : "");
      setError("");
    }
  }

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category.trim()) {
      setError("Category is required");
      return;
    }
    const amount = Number(limitAmount);
    if (!limitAmount || Number.isNaN(amount) || amount <= 0) {
      setError("Enter a valid limit amount");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await onSubmit({ category: category.trim(), limitAmount: amount.toFixed(2) });
      onClose();
    } catch (err: unknown) {
      const apiError = err as { error?: string };
      setError(apiError?.error ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-96 rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-2xl"
      >
        <h3 className="text-lg font-semibold text-brand-text">
          {initial ? "Edit budget" : "Create budget"}
        </h3>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <span className="text-xs text-brand-text-secondary">Category</span>
            <div className="mt-1">
              <CategorySelect
                value={category}
                onChange={setCategory}
                groups={groupedCategories}
                customOptions={customCategories}
                autoFocus
              />
            </div>
          </div>
          <div>
            <span className="text-xs text-brand-text-secondary">
              Monthly limit
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="mt-1 w-full rounded-md border border-brand-border-subtle bg-brand-bg px-2 py-2 text-brand-text focus:outline-none"
              value={limitAmount}
              onChange={(e) => setLimitAmount(e.target.value)}
              placeholder="500"
            />
          </div>
          {error && <p className="text-xs text-brand-error">{error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-brand-border-subtle px-4 py-2 text-sm text-brand-text-secondary transition-colors duration-200 hover:text-brand-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-brand-bg transition-colors duration-200 hover:bg-brand-green-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Saving…" : initial ? "Save changes" : "Create budget"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
