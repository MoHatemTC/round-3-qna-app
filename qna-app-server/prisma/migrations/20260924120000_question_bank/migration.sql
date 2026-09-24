-- Question bank: questions no longer belong to a single quiz. They are linked
-- to quizzes through quiz_questions, which also records their order.

-- CreateEnum
CREATE TYPE "QuestionDifficulty" AS ENUM ('easy', 'medium', 'hard');

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "category" TEXT,
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "difficulty" "QuestionDifficulty" NOT NULL DEFAULT 'medium',
ADD COLUMN     "explanation" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "quiz_questions" (
    "quiz_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("quiz_id","question_id")
);

-- Backfill: every existing question keeps its quiz, in the order it was
-- created, and is credited to that quiz's creator.
INSERT INTO "quiz_questions" ("quiz_id", "question_id", "position", "added_at")
SELECT "quiz_id",
       "id",
       ROW_NUMBER() OVER (PARTITION BY "quiz_id" ORDER BY "created_at", "id") - 1,
       "created_at"
FROM "Question";

UPDATE "Question" q
SET "created_by" = z."created_by"
FROM "Quiz" z
WHERE z."id" = q."quiz_id";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_quiz_id_fkey";

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "quiz_id";

-- CreateIndex
CREATE INDEX "Question_is_active_created_at_idx" ON "Question"("is_active", "created_at");

-- CreateIndex
CREATE INDEX "quiz_questions_question_id_idx" ON "quiz_questions"("question_id");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
