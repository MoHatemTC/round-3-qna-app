/*
  Warnings:

  - A unique constraint covering the columns `[quiz_id,user_id]` on the table `Attempt` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('verification', 'invitation');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('pending', 'sent', 'failed');

-- AlterTable
ALTER TABLE "Attempt" ALTER COLUMN "score" DROP DEFAULT,
ALTER COLUMN "percentage" DROP DEFAULT;

-- CreateTable
CREATE TABLE "email_delivery_logs" (
    "id" TEXT NOT NULL,
    "type" "EmailType" NOT NULL,
    "recipient" TEXT NOT NULL,
    "related_id" TEXT,
    "status" "EmailStatus" NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_delivery_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Attempt_quiz_id_user_id_key" ON "Attempt"("quiz_id", "user_id");
