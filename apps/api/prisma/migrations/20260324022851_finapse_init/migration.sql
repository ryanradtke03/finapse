/*
  Warnings:

  - You are about to drop the `Ingredient` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Recipe` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Step` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `full_name` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Ingredient" DROP CONSTRAINT "Ingredient_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "Recipe" DROP CONSTRAINT "Recipe_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Step" DROP CONSTRAINT "Step_recipeId_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "full_name" TEXT NOT NULL;

-- DropTable
DROP TABLE "Ingredient";

-- DropTable
DROP TABLE "Recipe";

-- DropTable
DROP TABLE "Step";
