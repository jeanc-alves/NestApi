/*
  Warnings:

  - Made the column `courseId` on table `Activities` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Activities" DROP CONSTRAINT "Activities_courseId_fkey";

-- AlterTable
ALTER TABLE "Activities" ALTER COLUMN "courseId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Activities" ADD CONSTRAINT "Activities_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
