-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "personal_finance_category_detail" TEXT,
ADD COLUMN     "user_category" TEXT;

-- CreateIndex
CREATE INDEX "transactions_user_category_idx" ON "transactions"("user_category");
