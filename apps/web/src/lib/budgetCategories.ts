// Curated, detailed-level subset of Plaid's `personal_finance_category
// .detailed` taxonomy, restricted to values that make sense as a spending
// budget line.
//
// Excluded on purpose: everything under INCOME, LOAN_DISBURSEMENTS,
// TRANSFER_IN, TRANSFER_OUT (all inflows, not spending) and OTHER_OTHER
// (catch-all, not a useful budget).
//
// This is hardcoded from Plaid's published taxonomy rather than derived from
// live transaction data, so the "create budget" picker can offer every
// category up front — even ones the user has no spend in yet. Source:
// https://plaid.com/documents/pfc-taxonomy-all.csv
//
// Only VALUES + GROUPS live here — labels are NOT duplicated in this file.
// Every display call site should call getTransactionCategoryLabel() from
// transactionCategories.ts, so a given raw value always renders identical
// text everywhere in the app (Transactions badges, Dashboard, Budgets).
//
// Values are stored as-is on Budget.category. Matching against transactions
// is detailed-aware but stays backward compatible with budgets created back
// when this list was primary-level only (e.g. a budget still storing
// "FOOD_AND_DRINK"): buildDetailedCategoryWhere on the backend, and the
// startsWith(category + "_") aggregation in Budgets.tsx, both treat a
// primary-level value as "every detailed category under this bucket."
export const BUDGET_CATEGORIES: { value: string; group: string }[] = [
  // Food & Drink
  { value: "FOOD_AND_DRINK_GROCERIES", group: "Food & Drink" },
  { value: "FOOD_AND_DRINK_RESTAURANT", group: "Food & Drink" },
  { value: "FOOD_AND_DRINK_COFFEE", group: "Food & Drink" },
  { value: "FOOD_AND_DRINK_FAST_FOOD", group: "Food & Drink" },
  { value: "FOOD_AND_DRINK_BEER_WINE_AND_LIQUOR", group: "Food & Drink" },
  { value: "FOOD_AND_DRINK_VENDING_MACHINES", group: "Food & Drink" },
  { value: "FOOD_AND_DRINK_OTHER_FOOD_AND_DRINK", group: "Food & Drink" },

  // Shopping
  { value: "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES", group: "Shopping" },
  { value: "GENERAL_MERCHANDISE_SUPERSTORES", group: "Shopping" },
  { value: "GENERAL_MERCHANDISE_DEPARTMENT_STORES", group: "Shopping" },
  { value: "GENERAL_MERCHANDISE_DISCOUNT_STORES", group: "Shopping" },
  { value: "GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES", group: "Shopping" },
  { value: "GENERAL_MERCHANDISE_ELECTRONICS", group: "Shopping" },
  { value: "GENERAL_MERCHANDISE_CONVENIENCE_STORES", group: "Shopping" },
  { value: "GENERAL_MERCHANDISE_BOOKSTORES_AND_NEWSSTANDS", group: "Shopping" },
  { value: "GENERAL_MERCHANDISE_GIFTS_AND_NOVELTIES", group: "Shopping" },
  { value: "GENERAL_MERCHANDISE_OFFICE_SUPPLIES", group: "Shopping" },
  { value: "GENERAL_MERCHANDISE_PET_SUPPLIES", group: "Shopping" },
  { value: "GENERAL_MERCHANDISE_SPORTING_GOODS", group: "Shopping" },
  { value: "GENERAL_MERCHANDISE_TOBACCO_AND_VAPE", group: "Shopping" },
  { value: "GENERAL_MERCHANDISE_OTHER_GENERAL_MERCHANDISE", group: "Shopping" },

  // Transportation
  { value: "TRANSPORTATION_GAS", group: "Transportation" },
  { value: "TRANSPORTATION_TAXIS_AND_RIDE_SHARES", group: "Transportation" },
  { value: "TRANSPORTATION_PUBLIC_TRANSIT", group: "Transportation" },
  { value: "TRANSPORTATION_PARKING", group: "Transportation" },
  { value: "TRANSPORTATION_TOLLS", group: "Transportation" },
  { value: "TRANSPORTATION_BIKES_AND_SCOOTERS", group: "Transportation" },
  { value: "TRANSPORTATION_OTHER_TRANSPORTATION", group: "Transportation" },

  // Travel
  { value: "TRAVEL_FLIGHTS", group: "Travel" },
  { value: "TRAVEL_LODGING", group: "Travel" },
  { value: "TRAVEL_RENTAL_CARS", group: "Travel" },
  { value: "TRAVEL_OTHER_TRAVEL", group: "Travel" },

  // Rent & Utilities
  { value: "RENT_AND_UTILITIES_RENT", group: "Rent & Utilities" },
  { value: "RENT_AND_UTILITIES_GAS_AND_ELECTRICITY", group: "Rent & Utilities" },
  { value: "RENT_AND_UTILITIES_WATER", group: "Rent & Utilities" },
  { value: "RENT_AND_UTILITIES_INTERNET_AND_CABLE", group: "Rent & Utilities" },
  { value: "RENT_AND_UTILITIES_TELEPHONE", group: "Rent & Utilities" },
  { value: "RENT_AND_UTILITIES_SEWAGE_AND_WASTE_MANAGEMENT", group: "Rent & Utilities" },
  { value: "RENT_AND_UTILITIES_OTHER_UTILITIES", group: "Rent & Utilities" },

  // Entertainment
  { value: "ENTERTAINMENT_MUSIC_AND_AUDIO", group: "Entertainment" },
  { value: "ENTERTAINMENT_TV_AND_MOVIES", group: "Entertainment" },
  { value: "ENTERTAINMENT_VIDEO_GAMES", group: "Entertainment" },
  { value: "ENTERTAINMENT_CASINOS_AND_GAMBLING", group: "Entertainment" },
  {
    value: "ENTERTAINMENT_SPORTING_EVENTS_AMUSEMENT_PARKS_AND_MUSEUMS",
    group: "Entertainment",
  },
  { value: "ENTERTAINMENT_OTHER_ENTERTAINMENT", group: "Entertainment" },

  // Medical
  { value: "MEDICAL_PRIMARY_CARE", group: "Medical" },
  { value: "MEDICAL_DENTAL_CARE", group: "Medical" },
  { value: "MEDICAL_EYE_CARE", group: "Medical" },
  { value: "MEDICAL_PHARMACIES_AND_SUPPLEMENTS", group: "Medical" },
  { value: "MEDICAL_VETERINARY_SERVICES", group: "Medical" },
  { value: "MEDICAL_NURSING_CARE", group: "Medical" },
  { value: "MEDICAL_OTHER_MEDICAL", group: "Medical" },

  // Personal Care
  { value: "PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS", group: "Personal Care" },
  { value: "PERSONAL_CARE_HAIR_AND_BEAUTY", group: "Personal Care" },
  { value: "PERSONAL_CARE_LAUNDRY_AND_DRY_CLEANING", group: "Personal Care" },
  { value: "PERSONAL_CARE_OTHER_PERSONAL_CARE", group: "Personal Care" },

  // Home Improvement
  { value: "HOME_IMPROVEMENT_FURNITURE", group: "Home Improvement" },
  { value: "HOME_IMPROVEMENT_HARDWARE", group: "Home Improvement" },
  { value: "HOME_IMPROVEMENT_REPAIR_AND_MAINTENANCE", group: "Home Improvement" },
  { value: "HOME_IMPROVEMENT_SECURITY", group: "Home Improvement" },
  { value: "HOME_IMPROVEMENT_OTHER_HOME_IMPROVEMENT", group: "Home Improvement" },

  // Services
  { value: "GENERAL_SERVICES_AUTOMOTIVE", group: "Services" },
  { value: "GENERAL_SERVICES_CHILDCARE", group: "Services" },
  { value: "GENERAL_SERVICES_EDUCATION", group: "Services" },
  { value: "GENERAL_SERVICES_INSURANCE", group: "Services" },
  { value: "GENERAL_SERVICES_ACCOUNTING_AND_FINANCIAL_PLANNING", group: "Services" },
  { value: "GENERAL_SERVICES_CONSULTING_AND_LEGAL", group: "Services" },
  { value: "GENERAL_SERVICES_POSTAGE_AND_SHIPPING", group: "Services" },
  { value: "GENERAL_SERVICES_STORAGE", group: "Services" },
  { value: "GENERAL_SERVICES_OTHER_GENERAL_SERVICES", group: "Services" },

  // Loan Payments
  { value: "LOAN_PAYMENTS_CAR_PAYMENT", group: "Loan Payments" },
  { value: "LOAN_PAYMENTS_CREDIT_CARD_PAYMENT", group: "Loan Payments" },
  { value: "LOAN_PAYMENTS_MORTGAGE_PAYMENT", group: "Loan Payments" },
  { value: "LOAN_PAYMENTS_PERSONAL_LOAN_PAYMENT", group: "Loan Payments" },
  { value: "LOAN_PAYMENTS_STUDENT_LOAN_PAYMENT", group: "Loan Payments" },
  { value: "LOAN_PAYMENTS_BNPL", group: "Loan Payments" },
  { value: "LOAN_PAYMENTS_CASH_ADVANCES", group: "Loan Payments" },
  { value: "LOAN_PAYMENTS_EWA", group: "Loan Payments" },
  { value: "LOAN_PAYMENTS_OTHER_PAYMENT", group: "Loan Payments" },

  // Bank Fees
  { value: "BANK_FEES_ATM_FEES", group: "Bank Fees" },
  { value: "BANK_FEES_OVERDRAFT_FEES", group: "Bank Fees" },
  { value: "BANK_FEES_INSUFFICIENT_FUNDS", group: "Bank Fees" },
  { value: "BANK_FEES_INTEREST_CHARGE", group: "Bank Fees" },
  { value: "BANK_FEES_LATE_FEES", group: "Bank Fees" },
  { value: "BANK_FEES_FOREIGN_TRANSACTION_FEES", group: "Bank Fees" },
  { value: "BANK_FEES_CASH_ADVANCE", group: "Bank Fees" },
  { value: "BANK_FEES_OTHER_BANK_FEES", group: "Bank Fees" },

  // Government & Donations
  { value: "GOVERNMENT_AND_NON_PROFIT_DONATIONS", group: "Government & Donations" },
  { value: "GOVERNMENT_AND_NON_PROFIT_TAX_PAYMENT", group: "Government & Donations" },
  {
    value: "GOVERNMENT_AND_NON_PROFIT_GOVERNMENT_DEPARTMENTS_AND_AGENCIES",
    group: "Government & Donations",
  },
  {
    value: "GOVERNMENT_AND_NON_PROFIT_OTHER_GOVERNMENT_AND_NON_PROFIT",
    group: "Government & Donations",
  },

  // Recurring
  { value: "SUBSCRIPTION", group: "Recurring" },
];
