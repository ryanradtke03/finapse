import { apiBaseUrl } from "./index";

export interface TransactionFilters {
  accountId?: string;
  category?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  cursor?: string;
}

export interface TransactionsResponse {
  transactions: unknown[]; // swap for your Transaction type from @finapse/types
  nextCursor: string | null;
}

export const getTransactions = async (
  filters: TransactionFilters = {},
): Promise<TransactionsResponse> => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.append(key, String(value));
  }

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

export interface SummaryFilters {
  accountId?: string;
  startDate?: string;
  endDate?: string;
}

export interface TransactionSummary {
  byCategory: { category: string; total: number; count: number }[];
  totalSpent: number;
  totalIncome: number;
  // net?: number;      // add once you add it to the service
  // byDay?: {...}[];    // add when you build the over-time chart
}

export const getTransactionSummary = async (
  filters: SummaryFilters = {},
): Promise<TransactionSummary> => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.append(key, String(value));
  }

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

export const getTransaction = async (id: string) => {
  const res = await fetch(`${apiBaseUrl}/transaction/${id}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw await res.json();
  const data = await res.json();
  return data.transaction; // controller wraps { transaction }
};
