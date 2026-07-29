import { useEffect, useState } from "react";
import type { TransactionFilters } from "../api/transactions";
import { useItems } from "../hooks/useItems";
import {
  useInfiniteTransactions,
  useTransaction,
  useTransactionSummary,
} from "../hooks/useTransactions";

export default function Transactions() {
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<TransactionFilters>({});
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
  const summary = useTransactionSummary({}); // reused just for category options
  const q = useInfiniteTransactions(filters);
  const detail = useTransaction(selectedId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accounts = items.data?.flatMap((i: any) => i.accounts) ?? [];
  const categories = summary.data?.byCategory ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = q.data?.pages.flatMap((p: any) => p.transactions) ?? [];

  function setFilter<K extends keyof TransactionFilters>(
    key: K,
    value: TransactionFilters[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  }

  return (
    <div style={{ display: "flex" }}>
      {/* main list */}
      <div style={{ flex: 1, padding: 24 }}>
        <h2>Transactions</h2>

        <div style={{ display: "flex", gap: 12, margin: "12px 0" }}>
          <input
            placeholder="Search by merchant…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <select
            value={filters.category ?? ""}
            onChange={(e) => setFilter("category", e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.category} value={c.category}>
                {c.category}
              </option>
            ))}
          </select>
          <select
            value={filters.accountId ?? ""}
            onChange={(e) => setFilter("accountId", e.target.value)}
          >
            <option value="">All accounts</option>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {accounts.map((a: any) => (
              <option key={a.id} value={a.id}>
                {a.name} {a.mask ? `··${a.mask}` : ""}
              </option>
            ))}
          </select>
        </div>

        {q.isLoading && <p>Loading…</p>}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {rows.map((t: any) => (
          <div
            key={t.id}
            onClick={() => setSelectedId(t.id)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 4px",
              cursor: "pointer",
              background: selectedId === t.id ? "#eee" : "transparent",
            }}
          >
            <span>{t.merchantName ?? t.name}</span>
            <span>{t.userCategory ?? t.personalFinanceCategory ?? "—"}</span>
            <span>${Number(t.amount).toFixed(2)}</span>
          </div>
        ))}

        {q.hasNextPage && (
          <button
            onClick={() => q.fetchNextPage()}
            disabled={q.isFetchingNextPage}
          >
            {q.isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        )}
      </div>

      {/* detail drawer */}
      {selectedId && (
        <div style={{ width: 360, borderLeft: "1px solid #ccc", padding: 24 }}>
          <button
            onClick={() => setSelectedId(undefined)}
            style={{ float: "right" }}
          >
            X
          </button>
          {detail.isLoading && <p>Loading…</p>}
          {detail.data && (
            <>
              <h3>{detail.data.merchantName ?? detail.data.name}</h3>
              <p style={{ fontSize: 24 }}>
                ${Number(detail.data.amount).toFixed(2)}
              </p>
              <p>Date: {new Date(detail.data.date).toLocaleDateString()}</p>
              <p>
                Category:{" "}
                {detail.data.userCategory ??
                  detail.data.personalFinanceCategory ??
                  "—"}
              </p>
              <p>Status: {detail.data.pending ? "Pending" : "Posted"}</p>
              <p>Transaction ID: {detail.data.plaidTransactionId}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
