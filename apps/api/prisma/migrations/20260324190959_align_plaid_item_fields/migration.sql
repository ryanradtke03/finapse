/*
  Warnings:

  - You are about to drop the column `plaid_item_id` on the `plaid_items` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[item_id]` on the table `plaid_items` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `item_id` to the `plaid_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "plaid_items_plaid_item_id_key";

-- AlterTable
ALTER TABLE "plaid_items" DROP COLUMN "plaid_item_id",
ADD COLUMN     "item_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "plaid_items_item_id_key" ON "plaid_items"("item_id");
