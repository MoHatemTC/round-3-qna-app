ALTER TABLE "quiz_invitations"
ADD COLUMN "reminded_at" TIMESTAMP(3),
ADD COLUMN "reminder_count" INTEGER NOT NULL DEFAULT 0;