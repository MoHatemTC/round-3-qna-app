-- AlterTable
ALTER TABLE "User" ADD COLUMN     "verification_expires" TIMESTAMP(3),
ADD COLUMN     "verification_token" TEXT;
