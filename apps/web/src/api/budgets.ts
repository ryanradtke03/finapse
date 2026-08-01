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

export const getBudget = async (id: string): Promise<Budget> => {
  const res = await fetch(`${apiBaseUrl}/budget/${id}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export interface BudgetInput {
  category: string;
  limitAmount: string;
  periodStart: string;
}

export const createBudget = async (
  data: BudgetInput,
): Promise<Budget> => {
  const res = await fetch(`${apiBaseUrl}/budget`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const updateBudget = async (
  id: string,
  data: Partial<BudgetInput>,
): Promise<Budget> => {
  const res = await fetch(`${apiBaseUrl}/budget/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const deleteBudget = async (id: string): Promise<void> => {
  const res = await fetch(`${apiBaseUrl}/budget/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw await res.json();
};
