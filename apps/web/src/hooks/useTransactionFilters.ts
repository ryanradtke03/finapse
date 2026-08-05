import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Transaction filter state, mirrored to the URL query string so filtered
 * views are bookmarkable and the browser back/forward buttons work.
 *
 * `category` is multi-valued (repeated `?category=` params) to match the
 * Transactions page's multi-select; everything else is single-valued.
 */
export interface TransactionFilterValues {
  accountId?: string[];
  category?: string[];
  search?: string;
  startDate?: string;
  endDate?: string;
  /** Time-frame preset key (e.g. "30d"); resolved to start/end dates for the query. */
  range?: string;
}

/** Updates accept `undefined`/`null` to clear a filter from the URL. */
export type TransactionFilterUpdates = {
  [K in keyof TransactionFilterValues]?: TransactionFilterValues[K] | null;
};

const SINGLE_KEYS = ["search", "startDate", "endDate", "range"] as const;

export function useTransactionFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Derived from the URL. Stable identity while the query string is
  // unchanged (useSearchParams keeps a stable ref), so it can be handed
  // straight to React Query as part of the query key.
  const filters = useMemo<TransactionFilterValues>(() => {
    const next: TransactionFilterValues = {};
    for (const key of SINGLE_KEYS) {
      const value = searchParams.get(key);
      if (value) next[key] = value;
    }
    const accountIds = searchParams.getAll("accountId").filter(Boolean);
    if (accountIds.length > 0) next.accountId = accountIds;
    const categories = searchParams.getAll("category").filter(Boolean);
    if (categories.length > 0) next.category = categories;
    return next;
  }, [searchParams]);

  const setFilters = useCallback(
    (
      updates: TransactionFilterUpdates,
      opts?: { history?: "push" | "replace" },
    ) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(updates)) {
            // Rewrite the key from scratch so empty/null values are dropped.
            params.delete(key);
            if (value == null) continue;
            if (Array.isArray(value)) {
              for (const item of value) {
                if (item) params.append(key, item);
              }
            } else if (value !== "") {
              params.set(key, String(value));
            }
          }
          return params;
        },
        // Default: replace history so a filter tweak (or search keystroke)
        // doesn't stack an entry. Discrete drill-downs (clicking a chart day or
        // category) pass history: "push" so the browser Back button steps out
        // of them one at a time.
        { replace: opts?.history !== "push" },
      );
    },
    [setSearchParams],
  );

  return { filters, setFilters };
}
