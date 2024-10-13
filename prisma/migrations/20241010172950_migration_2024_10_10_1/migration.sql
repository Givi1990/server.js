-- AlterTable
ALTER TABLE "Question" ALTER COLUMN "answerType" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Option_questionId_idx" ON "Option"("questionId");

-- CreateIndex
CREATE INDEX "Question_surveyId_idx" ON "Question"("surveyId");

-- CreateIndex
CREATE INDEX "Survey_title_idx" ON "Survey"("title");

-- CreateIndex
CREATE INDEX "User_name_idx" ON "User"("name");
