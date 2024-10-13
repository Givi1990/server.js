/*
  Warnings:

  - Added the required column `user_id` to the `Answer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "user_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "is_admin" BOOLEAN,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);
