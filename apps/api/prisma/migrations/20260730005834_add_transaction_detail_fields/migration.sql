-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "payment_channel" TEXT,
ADD COLUMN     "merchant_entity_id" TEXT,
ADD COLUMN     "location" TEXT;
