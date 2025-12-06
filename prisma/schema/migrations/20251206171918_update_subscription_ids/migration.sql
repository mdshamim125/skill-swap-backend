/*
  Warnings:

  - You are about to drop the column `createdAt` on the `SubscriptionPlan` table. All the data in the column will be lost.
  - You are about to drop the column `targetRole` on the `SubscriptionPlan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SubscriptionPlan" DROP COLUMN "createdAt",
DROP COLUMN "targetRole";
