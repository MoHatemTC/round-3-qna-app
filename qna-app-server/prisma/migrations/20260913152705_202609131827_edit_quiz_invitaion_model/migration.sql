/*
  Warnings:

  - A unique constraint covering the columns `[quiz_id,email]` on the table `quiz_invitations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `quiz_invitations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('sent', 'failed', 'accepted');

-- DropIndex
DROP INDEX "quiz_invitations_quiz_id_user_id_key";

-- AlterTable
ALTER TABLE "quiz_invitations" ADD COLUMN     "email" TEXT,
ADD COLUMN     "sent_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "InvitationStatus" NOT NULL DEFAULT 'sent',
ALTER COLUMN "user_id" DROP NOT NULL;

DO $$ BEGIN
  IF EXISTS (SELECT lower(trim(email)) FROM "User" GROUP BY 1 HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'User emails collide when lowercased; resolve before migrating';
  END IF;
END $$;

UPDATE "User" SET "email" = lower(trim("email"));

UPDATE "quiz_invitations" qi
SET "email" = u."email"
FROM "User" u
WHERE u."id" = qi."user_id";

ALTER TABLE "quiz_invitations" ALTER COLUMN "email" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "quiz_invitations_quiz_id_email_key" ON "quiz_invitations"("quiz_id", "email");
