// src/prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // -----------------------------
  // Subscription Plans
  // -----------------------------
  await prisma.subscriptionPlan.createMany({
    data: [
      {
        id: "free",
        name: "Free Basic Plan",
        price: 0,
        durationDays: 0,
        description: "Includes 3 free bookings for new users",
      },
      {
        id: "monthly",
        name: "Monthly Premium",
        price: 1000,
        durationDays: 30,
        description: "Access all premium features for 1 month",
      },
      {
        id: "yearly",
        name: "Yearly Premium",
        price: 10000,
        durationDays: 365,
        description: "Access all premium features for 1 year",
      },
    ],
    skipDuplicates: true,
  });

  // -----------------------------
  // System Setting: Free bookings
  // -----------------------------
  const settingExists = await prisma.systemSetting.findFirst({
    where: { key: "FREE_BOOKINGS" },
  });

  if (!settingExists) {
    await prisma.systemSetting.create({
      data: {
        key: "FREE_BOOKINGS",
        value: "3",
        description: "Default free bookings available for new users",
      },
    });
  }

  console.log("✔ Subscription plans & system settings seeded.");
}

main()
  .catch((err) => {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit();
  });
