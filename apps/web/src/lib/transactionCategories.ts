// Detailed-level category labels + colors for the Transactions page.
//
// Unlike budgetCategories.ts (which stays at Plaid's primary level for
// Dashboard/Budgets), this operates on personalFinanceCategoryDetail plus a
// "SUBSCRIPTION" sentinel that isn't a real Plaid category at all — it's a
// heuristic computed server-side (see getRecurringTransactionIds in
// transaction.service.ts) from repeated same-merchant, similar-amount,
// ~monthly-cadence charges, since Plaid's own recurring-transactions
// endpoint isn't wired up.

// Hand-picked labels for the categories most likely to actually show up.
// Anything else falls back to stripping the primary-category prefix (e.g.
// "GENERAL_MERCHANDISE_") and humanizing the remainder.
const DETAILED_LABELS: Record<string, string> = {
  FOOD_AND_DRINK_GROCERIES: "Groceries",
  FOOD_AND_DRINK_RESTAURANT: "Dining",
  FOOD_AND_DRINK_COFFEE: "Coffee",
  FOOD_AND_DRINK_FAST_FOOD: "Fast Food",
  FOOD_AND_DRINK_BEER_WINE_AND_LIQUOR: "Beer, Wine & Liquor",
  FOOD_AND_DRINK_OTHER_FOOD_AND_DRINK: "Food & Drink",

  TRANSPORTATION_GAS: "Gas",
  TRANSPORTATION_TAXIS_AND_RIDE_SHARES: "Transport",
  TRANSPORTATION_PUBLIC_TRANSIT: "Public Transit",
  TRANSPORTATION_PARKING: "Parking",
  TRANSPORTATION_TOLLS: "Tolls",
  TRANSPORTATION_BIKES_AND_SCOOTERS: "Bikes & Scooters",

  GENERAL_MERCHANDISE_ONLINE_MARKETPLACES: "Shopping",
  GENERAL_MERCHANDISE_SUPERSTORES: "Shopping",
  GENERAL_MERCHANDISE_DEPARTMENT_STORES: "Shopping",
  GENERAL_MERCHANDISE_DISCOUNT_STORES: "Shopping",
  GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES: "Clothing",
  GENERAL_MERCHANDISE_ELECTRONICS: "Electronics",
  GENERAL_MERCHANDISE_PET_SUPPLIES: "Pet Supplies",

  RENT_AND_UTILITIES_RENT: "Rent",
  RENT_AND_UTILITIES_GAS_AND_ELECTRICITY: "Utilities",
  RENT_AND_UTILITIES_WATER: "Utilities",
  RENT_AND_UTILITIES_OTHER_UTILITIES: "Utilities",
  RENT_AND_UTILITIES_INTERNET_AND_CABLE: "Internet & Cable",
  RENT_AND_UTILITIES_TELEPHONE: "Phone",

  ENTERTAINMENT_MUSIC_AND_AUDIO: "Entertainment",
  ENTERTAINMENT_TV_AND_MOVIES: "Entertainment",
  ENTERTAINMENT_VIDEO_GAMES: "Entertainment",

  MEDICAL_PHARMACIES_AND_SUPPLEMENTS: "Pharmacy",
  MEDICAL_PRIMARY_CARE: "Medical",
  MEDICAL_DENTAL_CARE: "Dental",

  PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS: "Gym & Fitness",
  PERSONAL_CARE_HAIR_AND_BEAUTY: "Hair & Beauty",

  INCOME_SALARY: "Income",
  INCOME_DIVIDENDS: "Dividends",
  INCOME_TAX_REFUND: "Tax Refund",
  INCOME_OTHER: "Income",

  SUBSCRIPTION: "Subscription",
};

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
