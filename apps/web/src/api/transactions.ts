import type { Transaction } from "@finapse/types";
import { apiBaseUrl } from "./index";

export interface TransactionFilters {
  // Single value or several — each entry is sent as its own repeated query
  // param (matches the multi-select account/category filters).
  accountId?: string | string[];
  category?: string | string[];
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  cursor?: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  nextCursor: string | null;
  // Totals across the ENTIRE filtered set (not just the returned page).
  // totalAmount is signed net (positive = net outflow/spend).
  totalAmount: number;
  totalCount: number;
}

function buildFilterParams(
  filters: TransactionFilters | SummaryFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else {
      params.append(key, String(value));
    }
  }
  return params;
}

export const getTransactions = async (
  filters: TransactionFilters = {},
): Promise<TransactionsResponse> => {
  const params = buildFilterParams(filters);

  const res = await fetch(`${apiBaseUrl}/transaction?${params.toString()}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json();
    throw error;
  }

  return res.json();
};

export const getTransactionCategories = async (): Promise<string[]> => {
  const res = await fetch(`${apiBaseUrl}/transaction/categories`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw await res.json();
  const data = await res.json();
  return data.categories;
};

export interface TransactionPatch {
  // `category` maps to the server-side userCategory override; null clears it.
  category?: string | null;
  notes?: string | null;
  tags?: string[];
  // When set with a non-null category, also apply that category to the
  // merchant: "all" back-fills existing transactions too.
  applyToMerchant?: "future" | "all";
}

export const updateTransaction = async (
  id: string,
  patch: TransactionPatch,
): Promise<Transaction> => {
  const res = await fetch(`${apiBaseUrl}/transaction/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw await res.json();
  const data = await res.json();
  return data.transaction;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const res = await fetch(`${apiBaseUrl}/transaction/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw await res.json();
};

export interface SummaryFilters {
  accountId?: string | string[];
  startDate?: string;
  endDate?: string;
  // Single value (legacy) or several (Dashboard multi-select) — each entry is
  // sent as its own repeated `category` query param, same as TransactionFilters.
  category?: string | string[];
}

export interface TransactionSummary {
  byCategory: { category: string; total: number; count: number }[];
  byDay: { date: string; spending: number; income: number }[];
  totalSpent: number;
  totalIncome: number;
}

export const getTransactionSummary = async (
  filters: SummaryFilters = {},
): Promise<TransactionSummary> => {
  const params = buildFilterParams(filters);

  const res = await fetch(
    `${apiBaseUrl}/transaction/summary?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!res.ok) {
    const error = await res.json();
    throw error;
  }

  const data = await res.json();
  return data.summary; // your controller wraps it: res.json({ summary })
};

export const getTransaction = async (id: string): Promise<Transaction> => {
  const res = await fetch(`${apiBaseUrl}/transaction/${id}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw await res.json();
  const data = await res.json();
  return data.transaction; // controller wraps { transaction }
};

export interface CreateTransactionInput {
  accountId: string;
  // Signed: positive = expense, negative = income (set by the form's toggle).
  amount: number;
  date: string; // YYYY-MM-DD
  name: string; // description / payee
  category: string;
  notes?: string | null;
  tags?: string[];
}

export const createTransaction = async (
  input: CreateTransactionInput,
): Promise<Transaction> => {
  const res = await fetch(`${apiBaseUrl}/transaction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await res.json();
  const data = await res.json();
  return data.transaction; // controller wraps { transaction }
};
