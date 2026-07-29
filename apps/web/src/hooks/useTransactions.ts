import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getTransaction,
  getTransactions,
  getTransactionSummary,
  type SummaryFilters,
  type TransactionFilters,
} from "../api/transactions";

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: ["transactions", filters], // filters in the key = auto refetch on change
    queryFn: () => getTransactions(filters),
    placeholderData: (prev) => prev, // keep old rows visible while refetching
  });
}

export function useTransactionSummary(filters: SummaryFilters = {}) {
  return useQuery({
    queryKey: ["transaction-summary", filters],
    queryFn: () => getTransactionSummary(filters),
    placeholderData: (prev) => prev,
  });
}

// paginated list (Load more)
export function useInfiniteTransactions(filters: TransactionFilters = {}) {
  return useInfiniteQuery({
    queryKey: ["transactions", "infinite", filters],
    queryFn: ({ pageParam }) =>
      getTransactions({ ...filters, cursor: pageParam, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    placeholderData: (prev) => prev,
  });
}

// single transaction for the drawer
export function useTransaction(id?: string) {
  return useQuery({
    queryKey: ["transaction", id],
    queryFn: () => getTransaction(id!),
    enabled: !!id, // only fetches when a row is selected
  });
}
