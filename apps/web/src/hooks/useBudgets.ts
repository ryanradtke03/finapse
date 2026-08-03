import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  copyBudgets,
  createBudget,
  deleteBudget,
  getBudget,
  getBudgets,
  updateBudget,
  type BudgetInput,
} from "../api/budgets";

// periodStart (YYYY-MM-01) scopes to a single month; omit for all budgets.
export function useBudgets(periodStart?: string) {
  return useQuery({
    queryKey: ["budgets", periodStart ?? null],
    queryFn: () => getBudgets(periodStart),
    placeholderData: (prev) => prev,
  });
}

export function useBudget(id?: string) {
  return useQuery({
    queryKey: ["budget", id],
    queryFn: () => getBudget(id!),
    enabled: !!id, // only fetches once an id is provided
  });
}

// Shared invalidation after any budget write: refresh the list and, when we
// know which budget changed, its single-budget cache entry.
function invalidateBudgetQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
) {
  queryClient.invalidateQueries({ queryKey: ["budgets"] });
  if (id) queryClient.invalidateQueries({ queryKey: ["budget", id] });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BudgetInput) => createBudget(data),
    onSuccess: () => invalidateBudgetQueries(queryClient),
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BudgetInput> }) =>
      updateBudget(id, data),
    onSuccess: (_data, { id }) => invalidateBudgetQueries(queryClient, id),
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onSuccess: () => invalidateBudgetQueries(queryClient),
  });
}

export function useCopyBudgets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) =>
      copyBudgets(from, to),
    onSuccess: () => invalidateBudgetQueries(queryClient),
  });
}
