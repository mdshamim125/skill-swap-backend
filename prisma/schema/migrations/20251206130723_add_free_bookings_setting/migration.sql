-- AlterTable
ALTER TABLE "SystemSetting" ADD COLUMN     "freeBookings" INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "freeBookingsLeft" INTEGER NOT NULL DEFAULT 0;
