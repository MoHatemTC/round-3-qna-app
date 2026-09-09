-- CreateTable
CREATE TABLE "AttemptAnswer" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "selected_option_id" TEXT,
    "boolean_answer" BOOLEAN,
    "is_correct" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttemptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AttemptAnswer_attempt_id_question_id_key" ON "AttemptAnswer"("attempt_id", "question_id");

-- AddForeignKey
ALTER TABLE "AttemptAnswer" ADD CONSTRAINT "AttemptAnswer_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
