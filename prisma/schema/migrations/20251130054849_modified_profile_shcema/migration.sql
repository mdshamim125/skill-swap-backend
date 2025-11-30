-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "expertise" TEXT,
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];
