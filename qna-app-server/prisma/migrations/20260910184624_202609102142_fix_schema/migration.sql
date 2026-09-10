-- DropIndex
DROP INDEX "Attempt_quiz_id_user_id_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "verification_sent_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "quiz_invitations" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quiz_invitations_token_hash_key" ON "quiz_invitations"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_invitations_quiz_id_user_id_key" ON "quiz_invitations"("quiz_id", "user_id");

-- AddForeignKey
ALTER TABLE "AttemptAnswer" ADD CONSTRAINT "AttemptAnswer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptAnswer" ADD CONSTRAINT "AttemptAnswer_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "QuestionOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_invitations" ADD CONSTRAINT "quiz_invitations_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_invitations" ADD CONSTRAINT "quiz_invitations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
