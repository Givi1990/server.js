/*
  Warnings:

  - You are about to drop the column `answer_boolean` on the `Answer` table. All the data in the column will be lost.
  - Made the column `answer_text` on table `Answer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Answer" DROP COLUMN "answer_boolean",
ALTER COLUMN "answer_text" SET NOT NULL;
