-- CreateEnum
CREATE TYPE "PlaidItemStatus" AS ENUM ('ACTIVE', 'NEEDS_REAUTH', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "RecurringFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ANNUALLY');

-- CreateTable
CREATE TABLE "plaid_items" (
    "id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "plaid_item_id" TEXT NOT NULL,
    "institution_id" TEXT,
    "institution_name" TEXT,
    "transaction_cursor" TEXT,
    "status" "PlaidItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "plaid_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "plaid_account_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "official_name" TEXT,
    "mask" TEXT,
    "type" TEXT NOT NULL,
    "subtype" TEXT,
    "balance_current" DECIMAL(12,2),
    "balance_available" DECIMAL(12,2),
    "iso_currency_code" TEXT DEFAULT 'USD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "plaid_item_id" TEXT NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "plaid_transaction_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "iso_currency_code" TEXT DEFAULT 'USD',
    "date" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "merchant_name" TEXT,
    "category" TEXT[],
    "personal_finance_category" TEXT,
    "pending" BOOLEAN NOT NULL DEFAULT false,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurring_frequency" "RecurringFrequency",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "account_id" TEXT NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "limit_amount" DECIMAL(12,2) NOT NULL,
    "period_start" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plaid_items_plaid_item_id_key" ON "plaid_items"("plaid_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_plaid_account_id_key" ON "accounts"("plaid_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_plaid_transaction_id_key" ON "transactions"("plaid_transaction_id");

-- CreateIndex
CREATE INDEX "transactions_account_id_date_idx" ON "transactions"("account_id", "date");

-- CreateIndex
CREATE INDEX "transactions_personal_finance_category_idx" ON "transactions"("personal_finance_category");

-- CreateIndex
CREATE INDEX "budgets_user_id_period_start_idx" ON "budgets"("user_id", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_user_id_category_period_start_key" ON "budgets"("user_id", "category", "period_start");

-- AddForeignKey
ALTER TABLE "plaid_items" ADD CONSTRAINT "plaid_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_plaid_item_id_fkey" FOREIGN KEY ("plaid_item_id") REFERENCES "plaid_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
