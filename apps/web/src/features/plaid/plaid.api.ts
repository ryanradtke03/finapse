import type { PlaidAccount } from "react-plaid-link";
import { apiBaseUrl } from "../../api/index";

export const createLinkToken = async (
  institutionId?: string
): Promise<{ link_token: string; mode: 'new' | 'update'; item_id?: string }> => {
  const res = await fetch(`${apiBaseUrl}/plaid/create-link-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ institution_id: institutionId }),
  })

  if (!res.ok) {
    const error = await res.json()
    throw error
  }

  return res.json()
}

// For managing accounts on an existing connection (add/remove accounts)
// Returns a link_token — use identically to createLinkToken in usePlaidLink
// After onSuccess, call syncTransactions(itemId) instead of exchangeToken

export const exchangeToken = async (
  public_token: string,
  institution: { id: string; name: string, accounts: PlaidAccount[] },
): Promise<{ success: boolean }> => {
  const res = await fetch(`${apiBaseUrl}/plaid/exchange-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ public_token, institution }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw error;
  }

  return res.json();
};

export const syncTransactions = async (
  itemId: string,
): Promise<{ added: number; modified: number; removed: number }> => {
  const res = await fetch(`${apiBaseUrl}/plaid/sync/${itemId}`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json();
    throw error;
  }

  return res.json();
};