/*
  Warnings:

  - The `expertise` column on the `Profile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `bio` on table `Profile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `country` on table `Profile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `city` on table `Profile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `hourlyRate` on table `Profile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Profile" ALTER COLUMN "bio" SET NOT NULL,
ALTER COLUMN "country" SET NOT NULL,
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "hourlyRate" SET NOT NULL,
DROP COLUMN "expertise",
ADD COLUMN     "expertise" "SkillLevel" NOT NULL DEFAULT 'BEGINNER';
