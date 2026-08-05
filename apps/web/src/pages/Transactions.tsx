import { useEffect, useMemo, useState } from "react";
import type { CreateTransactionInput } from "../api/transactions";
import { TransactionCreateModal } from "../components/TransactionCreateModal";
import {
  TransactionDetailPanel,
  type TransactionEditPatch,
} from "../components/TransactionDetailPanel";
import { CategoryBadge } from "../components/ui/CategoryBadge";
import { MultiSelectDropdown } from "../components/ui/MultiSelectDropdown";
import { CategoryFilterDropdown } from "../components/ui/CategoryFilterDropdown";
import { useBudgets } from "../hooks/useBudgets";
import { useItems } from "../hooks/useItems";
import { useTransactionFilters } from "../hooks/useTransactionFilters";
import { presetRange } from "../lib/dateRanges";
import { DateRangeControl } from "../components/ui/DateRangeControl";
import {
  useCreateTransaction,
  useDeleteTransaction,
  useInfiniteTransactions,
  useTransaction,
  useTransactionCategories,
  useUpdateTransaction,
} from "../hooks/useTransactions";
import {
  getEffectiveCategory,
  getTransactionCategoryColor,
  getTransactionCategoryLabel,
  isCustomCategory,
  TRANSACTION_CATEGORY_OPTIONS,
} from "../lib/transactionCategories";

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className="shrink-0 text-brand-text-secondary"
    >
      <circle cx="7" cy="7" r="5" />
      <path d="M14 14l-3-3" />
    </svg>
  );
}

function formatMoney(value: number): string {
  return `$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Transactions() {
  // URL-driven filter state (bookmarkable, back/forward works). The returned
  // `filters` object doubles as the React Query key.
  const { filters, setFilters } = useTransactionFilters();
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [createOpen, setCreateOpen] = useState(false);

  // Keep the search box in sync when the URL changes externally (e.g. the
  // user hits back/forward). Render-time adjustment rather than an effect —
  // same pattern as BudgetModal. Won't clobber in-progress typing because the
  // URL only catches up to `searchInput` after the debounce below fires.
  const [lastUrlSearch, setLastUrlSearch] = useState(filters.search ?? "");
  if ((filters.search ?? "") !== lastUrlSearch) {
    setLastUrlSearch(filters.search ?? "");
    setSearchInput(filters.search ?? "");
  }

  // Debounce the search box → push into the URL only after typing pauses.
  useEffect(() => {
    const t = setTimeout(
      () => setFilters({ search: searchInput || undefined }),
      300,
    );
    return () => clearTimeout(t);
  }, [searchInput, setFilters]);

  // Resolve the time-frame preset to concrete start/end dates for the query
  // (the API filters on startDate/endDate; `range` is a UI/URL concern only).
  const queryFilters = useMemo(() => {
    const { range, ...rest } = filters;
    return range ? { ...rest, ...presetRange(range) } : rest;
  }, [filters]);

  const items = useItems();
  const categoriesQuery = useTransactionCategories();
  const budgetsQuery = useBudgets(); // all budgets, for custom-category reuse
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();
  const createMutation = useCreateTransaction();
  const q = useInfiniteTransactions(queryFilters);
  const detail = useTransaction(selectedId);

  const accounts = items.data?.flatMap((i) => i.accounts) ?? [];
  const rows = q.data?.pages.flatMap((p) => p.transactions) ?? [];

  // Totals span the whole filtered set (same on every page), so read the first.
  const totalAmount = q.data?.pages[0]?.totalAmount ?? 0;
  const totalCount = q.data?.pages[0]?.totalCount ?? 0;
  const totalIsIncome = totalAmount < 0; // signed: negative = net inflow

  const accountLookup = useMemo(() => {
    const map = new Map<
      string,
      { institutionName: string; mask: string | null }
    >();
    for (const item of items.data ?? []) {
      for (const a of item.accounts) {
        map.set(a.id, {
          institutionName: item.institutionName ?? "Bank",
          mask: a.mask,
        });
      }
    }
    return map;
  }, [items.data]);

  const categoryOptions = (categoriesQuery.data ?? []).map((value) => ({
    value,
    label: getTransactionCategoryLabel(value),
    color: getTransactionCategoryColor(value),
  }));

  // The user's existing custom categories, surfaced in the recategorize/create
  // pickers for reuse (FIN-90). Pulled from both transactions AND budgets, so a
  // custom budget category ("Kids") is assignable even before any transaction
  // has been filed under it.
  const customCategories = Array.from(
    new Set(
      [
        ...(categoriesQuery.data ?? []),
        ...(budgetsQuery.data ?? []).map((b) => b.category),
      ].filter(isCustomCategory),
    ),
  ).map((value) => ({ value, label: getTransactionCategoryLabel(value) }));

  const handleSave = async (patch: TransactionEditPatch) => {
    if (!selectedId) return;
    await updateMutation.mutateAsync({ id: selectedId, patch });
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    await deleteMutation.mutateAsync(selectedId);
    setSelectedId(undefined);
  };

  const accountSelectOptions = accounts.map((a) => ({
    value: a.id,
    label: `${a.name}${a.mask ? ` ··${a.mask}` : ""}`,
  }));

  const handleCreate = (input: CreateTransactionInput) =>
    createMutation.mutateAsync(input).then(() => undefined);

  const hasActiveFilters = !!(
    filters.search ||
    (filters.accountId && filters.accountId.length > 0) ||
    filters.range ||
    filters.startDate ||
    filters.endDate ||
    (filters.category && filters.category.length > 0)
  );

  const clearAllFilters = () => {
    setFilters({
      search: null,
      accountId: null,
      category: null,
      range: null,
      startDate: null,
      endDate: null,
    });
    setSearchInput("");
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap gap-3">
        <div className="flex min-w-64 flex-1 items-center gap-2 rounded-xl border border-brand-border-subtle bg-brand-surface px-4 py-2.5">
          <SearchIcon />
          <input
            placeholder="Search by merchant…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-transparent text-sm text-brand-text placeholder:text-brand-text-secondary focus:outline-none"
          />
        </div>
        <MultiSelectDropdown
          label="Account"
          values={filters.accountId ?? []}
          options={accounts.map((a) => ({
            value: a.id,
            label: `${a.name}${a.mask ? ` ··${a.mask}` : ""}`,
          }))}
          onChange={(values) => setFilters({ accountId: values })}
          allLabel="All Accounts"
          className="w-56"
        />
        <DateRangeControl
          label="Time frame"
          value={{
            range: filters.range,
            startDate: filters.startDate,
            endDate: filters.endDate,
          }}
          onChange={(v) =>
            setFilters({
              range: v.range ?? null,
              startDate: v.startDate ?? null,
              endDate: v.endDate ?? null,
            })
          }
          includeAllTime
          className="w-56"
        />
        <CategoryFilterDropdown
          label="Categories"
          values={filters.category ?? []}
          options={categoryOptions}
          onChange={(values) => setFilters({ category: values })}
          allLabel="All Categories"
          className="w-56"
        />
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            title="Clear all filters"
            className="flex items-center gap-1.5 self-stretch rounded-xl border border-brand-border-subtle px-4 text-sm font-medium text-brand-text-secondary transition-colors duration-150 hover:border-brand-border hover:text-brand-text"
          >
            Clear filters
            <span className="text-base leading-none">×</span>
          </button>
        )}
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          disabled={accounts.length === 0}
          title={
            accounts.length === 0 ? "Connect an account first" : undefined
          }
          className="shrink-0 cursor-pointer rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-brand-bg transition-colors duration-200 hover:bg-brand-green-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Add transaction
        </button>
      </div>

      {!q.isLoading && rows.length > 0 && (
        <div className="mb-3 flex items-center justify-between px-1 text-sm">
          <span className="text-brand-text-secondary">
            {totalCount} {totalCount === 1 ? "transaction" : "transactions"}
          </span>
          <span className="text-brand-text-secondary">
            Total{" "}
            <span
              className={`font-semibold ${totalIsIncome ? "text-brand-green" : "text-brand-text"}`}
            >
              {totalIsIncome ? "+" : "-"}
              {formatMoney(totalAmount)}
            </span>
          </span>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
        <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr] gap-4 border-b border-brand-border-subtle px-5 py-3 text-xs tracking-wide text-brand-text-secondary uppercase">
          <span>Merchant</span>
          <span>Category</span>
          <span>Account</span>
          <span>Date</span>
          <span className="text-right">Amount</span>
        </div>

        {q.isLoading && (
          <p className="p-5 text-sm text-brand-text-secondary">Loading…</p>
        )}
        {!q.isLoading && rows.length === 0 && (
          <p className="p-5 text-sm text-brand-text-secondary">
            No transactions match these filters.
          </p>
        )}

        {rows.map((t) => {
          const account = accountLookup.get(t.accountId);
          const amount = Number(t.amount);
          const isIncome = amount < 0;
          return (
            <div
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={`grid cursor-pointer grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr] items-center gap-4 border-b border-brand-border-subtle px-5 py-3.5 transition-colors duration-100 last:border-0 hover:bg-brand-surface-raised ${
                selectedId === t.id ? "bg-brand-surface-raised" : ""
              }`}
            >
              <span className="truncate text-sm font-medium text-brand-text">
                {t.merchantName ?? t.name}
              </span>
              <CategoryBadge category={getEffectiveCategory(t)} />
              <span className="truncate text-sm text-brand-text-secondary">
                {account
                  ? `${account.institutionName} ··${account.mask ?? "----"}`
                  : "—"}
              </span>
              <span className="text-sm text-brand-text-secondary">
                {new Date(t.date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span
                className={`text-right text-sm font-semibold ${isIncome ? "text-brand-green" : "text-brand-text"}`}
              >
                {isIncome ? "+" : "-"}
                {formatMoney(amount)}
              </span>
            </div>
          );
        })}
      </div>

      {q.hasNextPage && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => q.fetchNextPage()}
            disabled={q.isFetchingNextPage}
            className="cursor-pointer rounded-lg border border-brand-border-subtle bg-brand-surface px-5 py-2 text-sm font-medium text-brand-text transition-colors duration-200 hover:border-brand-border disabled:cursor-not-allowed disabled:opacity-50"
          >
            {q.isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        </div>
      )}

      <TransactionDetailPanel
        open={!!selectedId}
        transaction={detail.data ?? null}
        loading={detail.isLoading}
        account={
          detail.data ? accountLookup.get(detail.data.accountId) : undefined
        }
        categoryOptions={TRANSACTION_CATEGORY_OPTIONS}
        customCategories={customCategories}
        onClose={() => setSelectedId(undefined)}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <TransactionCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        accounts={accountSelectOptions}
        categoryOptions={TRANSACTION_CATEGORY_OPTIONS}
        customCategories={customCategories}
        onSubmit={handleCreate}
      />
    </div>
  );
}
