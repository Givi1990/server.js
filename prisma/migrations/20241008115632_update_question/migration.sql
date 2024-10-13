/*
  Warnings:

  - You are about to drop the column `option_text` on the `Option` table. All the data in the column will be lost.
  - You are about to drop the column `question_id` on the `Option` table. All the data in the column will be lost.
  - You are about to drop the column `question_text` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `question_type` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `survey_id` on the `Question` table. All the data in the column will be lost.
  - Added the required column `option` to the `Option` table without a default value. This is not possible if the table is not empty.
  - Added the required column `questionId` to the `Option` table without a default value. This is not possible if the table is not empty.
  - Added the required column `answerType` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `questionText` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `questionType` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `surveyId` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `theme` to the `Survey` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Option" DROP CONSTRAINT "Option_question_id_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_survey_id_fkey";

-- DropIndex
DROP INDEX "Option_question_id_idx";

-- DropIndex
DROP INDEX "Question_survey_id_idx";

-- DropIndex
DROP INDEX "Survey_title_idx";

-- AlterTable
ALTER TABLE "Option" DROP COLUMN "option_text",
DROP COLUMN "question_id",
ADD COLUMN     "option" TEXT NOT NULL,
ADD COLUMN     "questionId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Question" 
ADD COLUMN "answerType" VARCHAR NOT NULL DEFAULT 'default_value', 
ADD COLUMN "questionText" VARCHAR NOT NULL DEFAULT 'default_value', 
ADD COLUMN "questionType" VARCHAR NOT NULL DEFAULT 'default_value', 
ADD COLUMN "surveyId" INTEGER NOT NULL DEFAULT 0;

-- ALTER TABLE "Survey" 
-- ADD COLUMN "theme" VARCHAR NOT NULL DEFAULT 'default_theme';


-- AlterTable
ALTER TABLE "Survey" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "theme" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
