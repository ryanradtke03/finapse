-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('EMAIL_VERIFY', 'PASSWORD_RESET');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tokens_token_hash_key" ON "tokens"("token_hash");

-- CreateIndex
CREATE INDEX "tokens_user_id_type_idx" ON "tokens"("user_id", "type");

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
