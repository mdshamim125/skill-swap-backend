import { prisma } from "../src/app/shared/prisma";

// prisma/seed.ts
async function main() {
  await prisma.subscriptionPlan.createMany({
    data: [
      {
        name: "Monthly Premium",
        price: 1000,
        durationDays: 30,
        description: "Access all premium features for 1 month",
      },
      {
        name: "Yearly Premium",
        price: 10000,
        durationDays: 365,
        description: "Access all premium features for 1 year",
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch(console.error)
  .finally(() => process.exit());
