-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('PLAID', 'MANUAL');

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "source" "TransactionSource" NOT NULL DEFAULT 'PLAID',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
