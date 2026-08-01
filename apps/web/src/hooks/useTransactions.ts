import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  getTransactionCategories,
  getTransactions,
  getTransactionSummary,
  updateTransaction,
  type CreateTransactionInput,
  type SummaryFilters,
  type TransactionFilters,
  type TransactionPatch,
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

// distinct categories present in the user's data — used for the Transactions
// page's filter. (The recategorize picker uses the full curated taxonomy
// instead, see transactionCategories.ts / FIN-97.)
export function useTransactionCategories() {
  return useQuery({
    queryKey: ["transaction-categories"],
    queryFn: getTransactionCategories,
    placeholderData: (prev) => prev,
  });
}

// Shared invalidation after any transaction write: refresh the list, the
// selected row, the category filter set, and Dashboard/Budgets summaries.
function invalidateTransactionQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
) {
  queryClient.invalidateQueries({ queryKey: ["transactions"] });
  queryClient.invalidateQueries({ queryKey: ["transaction-categories"] });
  queryClient.invalidateQueries({ queryKey: ["transaction-summary"] });
  if (id) queryClient.invalidateQueries({ queryKey: ["transaction", id] });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: TransactionPatch }) =>
      updateTransaction(id, patch),
    onSuccess: (_data, { id }) => invalidateTransactionQueries(queryClient, id),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => invalidateTransactionQueries(queryClient),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTransactionInput) => createTransaction(input),
    onSuccess: () => invalidateTransactionQueries(queryClient),
  });
}
