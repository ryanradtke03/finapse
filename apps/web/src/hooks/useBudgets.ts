import { useQuery } from "@tanstack/react-query";
import { getBudgets } from "../api/budgets";

export function useBudgets() {
  return useQuery({
    queryKey: ["budgets"],
    queryFn: getBudgets,
    placeholderData: (prev) => prev,
  });
}
