-- DropIndex
DROP INDEX "Survey_title_idx";

-- AlterTable
ALTER TABLE "Survey" ADD COLUMN     "completed" BOOLEAN DEFAULT false,
ALTER COLUMN "description" DROP NOT NULL;
