-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "isCustom" BOOLEAN NOT NULL DEFAULT false;
