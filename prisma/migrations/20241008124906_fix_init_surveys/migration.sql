/*
  Warnings:

  - You are about to drop the column `answer_text` on the `Answer` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Answer` table. All the data in the column will be lost.
  - You are about to drop the column `question_id` on the `Answer` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Answer` table. All the data in the column will be lost.
  - You are about to drop the column `question_text` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `question_type` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `survey_id` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `is_admin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `is_blocked` on the `User` table. All the data in the column will be lost.
  - Added the required column `answerText` to the `Answer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `questionId` to the `Answer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Answer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_question_id_fkey";

-- DropIndex
DROP INDEX "Answer_question_id_idx";

-- AlterTable
ALTER TABLE "Answer" DROP COLUMN "answer_text",
DROP COLUMN "created_at",
DROP COLUMN "question_id",
DROP COLUMN "user_id",
ADD COLUMN     "answerText" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "questionId" INTEGER NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "question_text",
DROP COLUMN "question_type",
DROP COLUMN "survey_id";

-- AlterTable
ALTER TABLE "Survey" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "is_admin",
DROP COLUMN "is_blocked",
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Answer_questionId_idx" ON "Answer"("questionId");

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
