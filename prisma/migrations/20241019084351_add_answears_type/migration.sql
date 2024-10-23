-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "booleanAnswer" BOOLEAN,
ADD COLUMN     "numericAnswer" INTEGER,
ALTER COLUMN "answerText" DROP NOT NULL;
