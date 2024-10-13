-- AlterTable
ALTER TABLE "Question" ALTER COLUMN "question_type" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Survey" ALTER COLUMN "title" SET DATA TYPE TEXT;

-- CreateIndex
CREATE INDEX "Answer_question_id_idx" ON "Answer"("question_id");

-- CreateIndex
CREATE INDEX "Option_question_id_idx" ON "Option"("question_id");

-- CreateIndex
CREATE INDEX "Question_survey_id_idx" ON "Question"("survey_id");

-- CreateIndex
CREATE INDEX "Survey_title_idx" ON "Survey"("title");
