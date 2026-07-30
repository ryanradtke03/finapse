// Curated subset of Plaid's `personal_finance_category.primary` taxonomy,
// restricted to categories that make sense as spending budgets.
//
// Excluded on purpose: INCOME, LOAN_DISBURSEMENTS, TRANSFER_IN, TRANSFER_OUT
// (all inflows, not spending) and OTHER (catch-all, not a useful budget).
//
// This is hardcoded from Plaid's published taxonomy rather than derived from
// live transaction data, so the "create budget" picker can offer every
// category up front — even ones the user has no spend in yet this month.
// Source: https://plaid.com/documents/pfc-taxonomy-all.csv
//
// Values are stored as-is on Budget.category and matched directly against
// Transaction.personalFinanceCategory (or userCategory) server-side — no
// backend changes needed, this is purely a display/picker layer.
export const BUDGET_CATEGORIES: { value: string; label: string }[] = [
  { value: "FOOD_AND_DRINK", label: "Food & Drink" },
  { value: "GENERAL_MERCHANDISE", label: "Shopping" },
  { value: "TRANSPORTATION", label: "Transportation" },
  { value: "TRAVEL", label: "Travel" },
  { value: "RENT_AND_UTILITIES", label: "Rent & Utilities" },
  { value: "ENTERTAINMENT", label: "Entertainment" },
  { value: "MEDICAL", label: "Medical" },
  { value: "PERSONAL_CARE", label: "Personal Care" },
  { value: "HOME_IMPROVEMENT", label: "Home Improvement" },
  { value: "GENERAL_SERVICES", label: "Services" },
  { value: "LOAN_PAYMENTS", label: "Loan Payments" },
  { value: "BANK_FEES", label: "Bank Fees" },
  { value: "GOVERNMENT_AND_NON_PROFIT", label: "Government & Donations" },
];

const LABEL_BY_VALUE = new Map(
  BUDGET_CATEGORIES.map((c) => [c.value, c.label]),
);

// Friendly label for a raw category string. Falls back to a humanized
// version of the raw value for anything outside the curated list (custom
// userCategory overrides, or Plaid categories not yet added above), rather
// than silently dropping the value.
export function getCategoryLabel(value: string): string {
  const known = LABEL_BY_VALUE.get(value);
  if (known) return known;

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
