// Detailed-level category labels + colors for the Transactions page.
//
// Unlike budgetCategories.ts (which stays at Plaid's primary level for
// Dashboard/Budgets), this operates on personalFinanceCategoryDetail plus a
// "SUBSCRIPTION" sentinel that isn't a real Plaid category at all — it's a
// heuristic computed server-side (see getRecurringTransactionIds in
// transaction.service.ts) from repeated same-merchant, similar-amount,
// ~monthly-cadence charges, since Plaid's own recurring-transactions
// endpoint isn't wired up.

// Full spending-relevant detailed taxonomy (Plaid's `personal_finance_category
// .detailed`, https://plaid.com/documents/pfc-taxonomy-all.csv), so Budgets'
// category picker can offer every real option with a distinct, unambiguous
// label — not just the "most likely to show up" subset this used to be.
// Every value here MUST have a unique label: unlike a single transaction's
// badge (which has merchant name for context), a budget picker option is
// selected by label alone, so two different codes rendering identical text
// would be indistinguishable. Anything not listed falls back to stripping
// the primary-category prefix and humanizing the remainder.
//
// Deliberately excluded (not spending): INCOME_*, LOAN_DISBURSEMENTS_*,
// TRANSFER_IN_*, TRANSFER_OUT_*, OTHER_OTHER — see budgetCategories.ts.
const DETAILED_LABELS: Record<string, string> = {
  // BANK_FEES
  BANK_FEES_ATM_FEES: "ATM Fees",
  BANK_FEES_INSUFFICIENT_FUNDS: "Insufficient Funds Fees",
  BANK_FEES_INTEREST_CHARGE: "Interest Charges",
  BANK_FEES_FOREIGN_TRANSACTION_FEES: "Foreign Transaction Fees",
  BANK_FEES_OVERDRAFT_FEES: "Overdraft Fees",
  BANK_FEES_LATE_FEES: "Late Fees",
  BANK_FEES_CASH_ADVANCE: "Cash Advance Fees",
  BANK_FEES_OTHER_BANK_FEES: "Other Bank Fees",

  // ENTERTAINMENT
  ENTERTAINMENT_CASINOS_AND_GAMBLING: "Casinos & Gambling",
  ENTERTAINMENT_MUSIC_AND_AUDIO: "Music & Audio",
  ENTERTAINMENT_SPORTING_EVENTS_AMUSEMENT_PARKS_AND_MUSEUMS:
    "Events & Attractions",
  ENTERTAINMENT_TV_AND_MOVIES: "TV & Movies",
  ENTERTAINMENT_VIDEO_GAMES: "Video Games",
  ENTERTAINMENT_OTHER_ENTERTAINMENT: "Other Entertainment",

  // FOOD_AND_DRINK
  FOOD_AND_DRINK_BEER_WINE_AND_LIQUOR: "Beer, Wine & Liquor",
  FOOD_AND_DRINK_COFFEE: "Coffee",
  FOOD_AND_DRINK_FAST_FOOD: "Fast Food",
  FOOD_AND_DRINK_GROCERIES: "Groceries",
  FOOD_AND_DRINK_RESTAURANT: "Dining",
  FOOD_AND_DRINK_VENDING_MACHINES: "Vending Machines",
  FOOD_AND_DRINK_OTHER_FOOD_AND_DRINK: "Other Food & Drink",

  // GENERAL_MERCHANDISE
  GENERAL_MERCHANDISE_BOOKSTORES_AND_NEWSSTANDS: "Books & News",
  GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES: "Clothing",
  GENERAL_MERCHANDISE_CONVENIENCE_STORES: "Convenience Stores",
  GENERAL_MERCHANDISE_DEPARTMENT_STORES: "Department Stores",
  GENERAL_MERCHANDISE_DISCOUNT_STORES: "Discount Stores",
  GENERAL_MERCHANDISE_ELECTRONICS: "Electronics",
  GENERAL_MERCHANDISE_GIFTS_AND_NOVELTIES: "Gifts & Novelties",
  GENERAL_MERCHANDISE_OFFICE_SUPPLIES: "Office Supplies",
  GENERAL_MERCHANDISE_ONLINE_MARKETPLACES: "Online Marketplaces",
  GENERAL_MERCHANDISE_PET_SUPPLIES: "Pet Supplies",
  GENERAL_MERCHANDISE_SPORTING_GOODS: "Sporting Goods",
  GENERAL_MERCHANDISE_SUPERSTORES: "Superstores",
  GENERAL_MERCHANDISE_TOBACCO_AND_VAPE: "Tobacco & Vape",
  GENERAL_MERCHANDISE_OTHER_GENERAL_MERCHANDISE: "Other Merchandise",

  // HOME_IMPROVEMENT
  HOME_IMPROVEMENT_FURNITURE: "Furniture",
  HOME_IMPROVEMENT_HARDWARE: "Hardware",
  HOME_IMPROVEMENT_REPAIR_AND_MAINTENANCE: "Repair & Maintenance",
  HOME_IMPROVEMENT_SECURITY: "Home Security",
  HOME_IMPROVEMENT_OTHER_HOME_IMPROVEMENT: "Other Home Improvement",

  // MEDICAL
  MEDICAL_DENTAL_CARE: "Dental Care",
  MEDICAL_EYE_CARE: "Eye Care",
  MEDICAL_NURSING_CARE: "Nursing Care",
  MEDICAL_PHARMACIES_AND_SUPPLEMENTS: "Pharmacy & Supplements",
  MEDICAL_PRIMARY_CARE: "Primary Care",
  MEDICAL_VETERINARY_SERVICES: "Veterinary",
  MEDICAL_OTHER_MEDICAL: "Other Medical",

  // PERSONAL_CARE
  PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS: "Gyms & Fitness",
  PERSONAL_CARE_HAIR_AND_BEAUTY: "Hair & Beauty",
  PERSONAL_CARE_LAUNDRY_AND_DRY_CLEANING: "Laundry & Dry Cleaning",
  PERSONAL_CARE_OTHER_PERSONAL_CARE: "Other Personal Care",

  // GENERAL_SERVICES
  GENERAL_SERVICES_ACCOUNTING_AND_FINANCIAL_PLANNING:
    "Accounting & Financial Planning",
  GENERAL_SERVICES_AUTOMOTIVE: "Automotive Services",
  GENERAL_SERVICES_CHILDCARE: "Childcare",
  GENERAL_SERVICES_CONSULTING_AND_LEGAL: "Consulting & Legal",
  GENERAL_SERVICES_EDUCATION: "Education",
  GENERAL_SERVICES_INSURANCE: "Insurance",
  GENERAL_SERVICES_POSTAGE_AND_SHIPPING: "Postage & Shipping",
  GENERAL_SERVICES_STORAGE: "Storage",
  GENERAL_SERVICES_OTHER_GENERAL_SERVICES: "Other Services",

  // GOVERNMENT_AND_NON_PROFIT
  GOVERNMENT_AND_NON_PROFIT_DONATIONS: "Donations",
  GOVERNMENT_AND_NON_PROFIT_GOVERNMENT_DEPARTMENTS_AND_AGENCIES:
    "Government Agencies",
  GOVERNMENT_AND_NON_PROFIT_TAX_PAYMENT: "Tax Payments",
  GOVERNMENT_AND_NON_PROFIT_OTHER_GOVERNMENT_AND_NON_PROFIT:
    "Other Government & Non-Profit",

  // TRANSPORTATION
  TRANSPORTATION_BIKES_AND_SCOOTERS: "Bikes & Scooters",
  TRANSPORTATION_GAS: "Gas",
  TRANSPORTATION_PARKING: "Parking",
  TRANSPORTATION_PUBLIC_TRANSIT: "Public Transit",
  TRANSPORTATION_TAXIS_AND_RIDE_SHARES: "Taxis & Ride Shares",
  TRANSPORTATION_TOLLS: "Tolls",
  TRANSPORTATION_OTHER_TRANSPORTATION: "Other Transportation",

  // TRAVEL
  TRAVEL_FLIGHTS: "Flights",
  TRAVEL_LODGING: "Lodging",
  TRAVEL_RENTAL_CARS: "Rental Cars",
  TRAVEL_OTHER_TRAVEL: "Other Travel",

  // RENT_AND_UTILITIES
  RENT_AND_UTILITIES_GAS_AND_ELECTRICITY: "Gas & Electricity",
  RENT_AND_UTILITIES_INTERNET_AND_CABLE: "Internet & Cable",
  RENT_AND_UTILITIES_RENT: "Rent",
  RENT_AND_UTILITIES_SEWAGE_AND_WASTE_MANAGEMENT: "Sewage & Waste",
  RENT_AND_UTILITIES_TELEPHONE: "Phone",
  RENT_AND_UTILITIES_WATER: "Water",
  RENT_AND_UTILITIES_OTHER_UTILITIES: "Other Utilities",

  // LOAN_PAYMENTS
  LOAN_PAYMENTS_BNPL: "Buy Now, Pay Later",
  LOAN_PAYMENTS_CAR_PAYMENT: "Car Payment",
  LOAN_PAYMENTS_CASH_ADVANCES: "Cash Advance Payments",
  LOAN_PAYMENTS_CREDIT_CARD_PAYMENT: "Credit Card Payment",
  LOAN_PAYMENTS_EWA: "Early Wage Access Payments",
  LOAN_PAYMENTS_MORTGAGE_PAYMENT: "Mortgage Payment",
  LOAN_PAYMENTS_PERSONAL_LOAN_PAYMENT: "Personal Loan Payment",
  LOAN_PAYMENTS_STUDENT_LOAN_PAYMENT: "Student Loan Payment",
  LOAN_PAYMENTS_OTHER_PAYMENT: "Other Loan Payment",

  // INCOME (not budgetable, but shows up on badges for income transactions)
  INCOME_SALARY: "Income",
  INCOME_DIVIDENDS: "Dividends",
  INCOME_TAX_REFUND: "Tax Refund",
  INCOME_OTHER: "Income",

  // Heuristic sentinel, not a real Plaid value — see getRecurringTransactionIds.
  SUBSCRIPTION: "Subscription",
};

// Curated, alphabetized recategorize options for the detail panel (FIN-97).
// Sourced from the full taxonomy above rather than the categories that
// merely happen to appear in the user's own data, so you can reassign a
// transaction to any real spending category — not just ones you already
// have. Income buckets (not spending) and the SUBSCRIPTION heuristic
// sentinel (auto-derived, not user-assignable) are excluded.
export const TRANSACTION_CATEGORY_OPTIONS: { value: string; label: string }[] =
  Object.entries(DETAILED_LABELS)
    .filter(([value]) => value !== "SUBSCRIPTION" && !value.startsWith("INCOME"))
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

// Longest-first so e.g. "RENT_AND_UTILITIES" doesn't get shadowed by a
// shorter false-prefix match.
const PRIMARY_PREFIXES = [
  "GOVERNMENT_AND_NON_PROFIT",
  "LOAN_DISBURSEMENTS",
  "GENERAL_MERCHANDISE",
  "RENT_AND_UTILITIES",
  "HOME_IMPROVEMENT",
  "TRANSPORTATION",
  "GENERAL_SERVICES",
  "FOOD_AND_DRINK",
  "PERSONAL_CARE",
  "ENTERTAINMENT",
  "LOAN_PAYMENTS",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "BANK_FEES",
  "MEDICAL",
  "INCOME",
  "TRAVEL",
  "OTHER",
].sort((a, b) => b.length - a.length);

function humanizeWords(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getTransactionCategoryLabel(value: string): string {
  const known = DETAILED_LABELS[value];
  if (known) return known;

  // Bare primary category (e.g. "FOOD_AND_DRINK") → friendly group label, so a
  // whole-bucket budget/filter reads the same everywhere ("Food & Drink").
  if (PRIMARY_LABELS[value]) return PRIMARY_LABELS[value];

  // Fully custom, user-defined categories (FIN-90) are stored canonically as
  // CUSTOM_<UPPER_SNAKE> so a budget and a recategorized transaction always
  // match regardless of how the user typed them. Strip the prefix and
  // humanize so "CUSTOM_KIDS" renders as "Kids".
  if (value.startsWith(`${CUSTOM_PREFIX}_`)) {
    return humanizeWords(value.slice(CUSTOM_PREFIX.length + 1));
  }

  const prefix = PRIMARY_PREFIXES.find((p) => value.startsWith(`${p}_`));
  if (prefix) {
    const remainder = value.slice(prefix.length + 1);
    return remainder ? humanizeWords(remainder) : humanizeWords(prefix);
  }

  return humanizeWords(value);
}

// Deterministic per-category dot color so the same category always renders
// the same color without hand-authoring all ~104 detailed categories.
const DOT_PALETTE = [
  "#5fd93a", // green
  "#3b82f6", // blue
  "#a855f7", // purple
  "#f97316", // orange
  "#ef4444", // red
  "#eab308", // amber
  "#14b8a6", // teal
  "#ec4899", // pink
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getTransactionCategoryColor(value: string): string {
  return DOT_PALETTE[hashString(value) % DOT_PALETTE.length];
}

// Sentinel prefix for fully custom, user-defined categories (FIN-90) that
// aren't in Plaid's taxonomy at all (e.g. "Kids", "Pets"). Stored on
// Budget.category and Transaction.userCategory in a canonical form so a
// budget line and the transactions assigned to it always match exactly.
export const CUSTOM_PREFIX = "CUSTOM";

// Canonicalize free-text custom-category input to CUSTOM_<UPPER_SNAKE>.
// Case- and whitespace-insensitive so "Kids", "kids" and " KIDS " all collapse
// to CUSTOM_KIDS — the value stored is what buildDetailedCategoryWhere matches
// on (userCategory === value), so this is what guarantees a budget and the
// transactions filed under it line up. Returns "" for empty/garbage input so
// callers can treat it as "no category".
export function normalizeCustomCategory(input: string): string {
  const slug = input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug ? `${CUSTOM_PREFIX}_${slug}` : "";
}

// True for values produced by normalizeCustomCategory — i.e. user-defined
// categories, not Plaid taxonomy values or the SUBSCRIPTION/UNCATEGORIZED
// sentinels. Used to surface a user's existing custom categories in pickers.
export function isCustomCategory(value: string): boolean {
  return value.startsWith(`${CUSTOM_PREFIX}_`);
}

// Broad (Plaid primary) category → friendly group label, mirroring the Budgets
// groupings. Used by the grouped category filter so "Food & Drink" covers
// groceries, dining, coffee, etc.
const PRIMARY_LABELS: Record<string, string> = {
  FOOD_AND_DRINK: "Food & Drink",
  GENERAL_MERCHANDISE: "Shopping",
  TRANSPORTATION: "Transportation",
  TRAVEL: "Travel",
  RENT_AND_UTILITIES: "Rent & Utilities",
  ENTERTAINMENT: "Entertainment",
  MEDICAL: "Medical",
  PERSONAL_CARE: "Personal Care",
  HOME_IMPROVEMENT: "Home Improvement",
  GENERAL_SERVICES: "Services",
  BANK_FEES: "Bank Fees",
  LOAN_PAYMENTS: "Loan Payments",
  GOVERNMENT_AND_NON_PROFIT: "Government & Donations",
  INCOME: "Income",
  TRANSFER_IN: "Transfers In",
  TRANSFER_OUT: "Transfers Out",
  LOAN_DISBURSEMENTS: "Loan Disbursements",
};

// The broad primary bucket a detailed category belongs to (e.g.
// FOOD_AND_DRINK_COFFEE → FOOD_AND_DRINK). Returns null for values outside
// Plaid's taxonomy — custom categories, the SUBSCRIPTION heuristic, and
// UNCATEGORIZED — so callers can bucket those separately.
export function getPrimaryCategory(value: string): string | null {
  if (
    isCustomCategory(value) ||
    value === "SUBSCRIPTION" ||
    value === "UNCATEGORIZED"
  ) {
    return null;
  }
  const prefix = PRIMARY_PREFIXES.find(
    (p) => p !== "OTHER" && (value === p || value.startsWith(`${p}_`)),
  );
  return prefix ?? null;
}

export function getPrimaryCategoryLabel(primary: string): string {
  return PRIMARY_LABELS[primary] ?? getTransactionCategoryLabel(primary);
}

// Effective category for a transaction: an explicit user override always
// wins (that's the point of Recategorize), then the recurring/subscription
// heuristic, then Plaid's detailed category, then its primary category.
export function getEffectiveCategory(t: {
  userCategory: string | null;
  personalFinanceCategoryDetail: string | null;
  personalFinanceCategory: string | null;
  isRecurring: boolean;
}): string {
  if (t.userCategory) return t.userCategory;
  if (t.isRecurring) return "SUBSCRIPTION";
  return (
    t.personalFinanceCategoryDetail ?? t.personalFinanceCategory ?? "UNCATEGORIZED"
  );
}
