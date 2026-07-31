import { useEffect, useMemo, useState } from "react";
import type { TransactionFilters } from "../api/transactions";
import {
  TransactionDetailPanel,
  type TransactionEditPatch,
} from "../components/TransactionDetailPanel";
import { CategoryBadge } from "../components/ui/CategoryBadge";
import { Dropdown } from "../components/ui/Dropdown";
import { MultiSelectDropdown } from "../components/ui/MultiSelectDropdown";
import { useItems } from "../hooks/useItems";
import {
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
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  // debounce the search box → only updates filters after typing pauses
  useEffect(() => {
    const t = setTimeout(
      () => setFilters((f) => ({ ...f, search: searchInput || undefined })),
      300,
    );
    return () => clearTimeout(t);
  }, [searchInput]);

  const items = useItems();
  const categoriesQuery = useTransactionCategories();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();
  const q = useInfiniteTransactions({
    ...filters,
    category: selectedCategories.length > 0 ? selectedCategories : undefined,
  });
  const detail = useTransaction(selectedId);

  const accounts = items.data?.flatMap((i) => i.accounts) ?? [];
  const rows = q.data?.pages.flatMap((p) => p.transactions) ?? [];

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

  function setFilter<K extends keyof TransactionFilters>(
    key: K,
    value: TransactionFilters[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  }

  const handleSave = async (patch: TransactionEditPatch) => {
    if (!selectedId) return;
    await updateMutation.mutateAsync({ id: selectedId, patch });
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    await deleteMutation.mutateAsync(selectedId);
    setSelectedId(undefined);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-3">
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
          label="Categories"
          values={selectedCategories}
          options={categoryOptions}
          onChange={setSelectedCategories}
          allLabel="All Categories"
          className="w-56"
        />
        <Dropdown
          label="Account"
          value={filters.accountId ?? ""}
          options={[
            { value: "", label: "All Accounts" },
            ...accounts.map((a) => ({
              value: a.id,
              label: `${a.name}${a.mask ? ` ··${a.mask}` : ""}`,
            })),
          ]}
          onChange={(v) => setFilter("accountId", v)}
          className="w-56"
        />
      </div>

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
        onClose={() => setSelectedId(undefined)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
