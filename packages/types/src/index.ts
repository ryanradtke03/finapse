// ─── Enums ────────────────────────────────────────────────────────────────────

export type PlaidItemStatus = "ACTIVE" | "NEEDS_REAUTH" | "DISCONNECTED";

export type RecurringFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "ANNUALLY";

// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  // false for Google-only accounts (empty passwordHash server-side) — drives
  // the Settings page's "Signed in with Google" badge and disables the
  // change-password form.
  hasPassword: boolean;
}

export interface PlaidItem {
  id: string;
  itemId: string;
  institutionId: string | null;
  institutionName: string | null;
  status: PlaidItemStatus;
  updatedAt: string;        
  accounts: Account[];       
}

export interface Account {
  id: string;
  plaidAccountId: string;
  name: string;
  officialName: string | null;
  mask: string | null;
  type: string;
  subtype: string | null;
  balanceCurrent: string | null;
  balanceAvailable: string | null;
  isoCurrencyCode: string | null;
}

export interface Transaction {
  id: string;
  plaidTransactionId: string;
  accountId: string;
  amount: string;
  isoCurrencyCode: string | null;
  date: string;
  name: string;
  merchantName: string | null;
  category: string[];
  personalFinanceCategory: string | null;
  personalFinanceCategoryDetail: string | null;
  userCategory: string | null;
  paymentChannel: string | null;
  merchantEntityId: string | null;
  location: string | null;
  pending: boolean;
  isRecurring: boolean;
  recurringFrequency: RecurringFrequency | null;
}

export interface Budget {
  id: string;
  category: string;
  limitAmount: string;
  periodStart: string;
}

// ─── API Response Shapes ──────────────────────────────────────────────────────

export interface AuthResponse {
  user: User;
}

export interface MeResponse {
  user: User;
}
