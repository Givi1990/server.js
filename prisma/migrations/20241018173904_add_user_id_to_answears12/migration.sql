/*
  Warnings:

  - Added the required column `surveyId` to the `Answer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "surveyId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Answer_surveyId_idx" ON "Answer"("surveyId");

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
