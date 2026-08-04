-- AlterTable: track how a transaction's userCategory was set
ALTER TABLE "transactions" ADD COLUMN "category_source" TEXT;

-- CreateTable: per-merchant category rules
CREATE TABLE "merchant_category_rules" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "merchant_key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_category_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "merchant_category_rules_user_id_idx" ON "merchant_category_rules"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "merchant_category_rules_user_id_merchant_key_key" ON "merchant_category_rules"("user_id", "merchant_key");

-- AddForeignKey
ALTER TABLE "merchant_category_rules" ADD CONSTRAINT "merchant_category_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
