import { apiBaseUrl } from "./index";

export interface Budget {
  id: string;
  category: string;
  limitAmount: string; // Decimal serializes to string over JSON
  periodStart: string;
}

export const getBudgets = async (): Promise<Budget[]> => {
  const res = await fetch(`${apiBaseUrl}/budget`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw await res.json();
  return res.json(); // listBudgetHandler returns the array directly
};
