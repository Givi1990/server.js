-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "isMultipleChoice" BOOLEAN DEFAULT false;

-- CreateTable
CREATE TABLE "MultipleChoiceAnswer" (
    "id" SERIAL NOT NULL,
    "answerId" INTEGER NOT NULL,
    "option" TEXT NOT NULL,

    CONSTRAINT "MultipleChoiceAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MultipleChoiceAnswer_answerId_idx" ON "MultipleChoiceAnswer"("answerId");

-- AddForeignKey
ALTER TABLE "MultipleChoiceAnswer" ADD CONSTRAINT "MultipleChoiceAnswer_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
