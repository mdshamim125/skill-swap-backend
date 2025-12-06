// import cron from "node-cron";
// import { prisma } from "../shared/prisma";

// // ⏰ Runs every day at 12:00 AM
// cron.schedule("0 0 * * *", async () => {
//   console.log("🔍 Checking expired subscriptions...");

//   const now = new Date();

//   // Find active subscriptions that are expired
//   const expiredSubs = await prisma.subscription.findMany({
//     where: {
//       status: "ACTIVE",
//       expiresAt: { lt: now },
//     },
//   });

//   if (expiredSubs.length === 0) {
//     console.log("No expired subscriptions found.");
//     return;
//   }

//   for (const sub of expiredSubs) {
//     // 1. Mark subscription as expired
//     await prisma.subscription.update({
//       where: { id: sub.id },
//       data: { status: "EXPIRED" },
//     });

//     // 2. Downgrade user
//     await prisma.user.update({
//       where: { id: sub.userId },
//       data: {
//         isPremium: false,
//         premiumExpires: null,
//       },
//     });
//   }

//   console.log(`✔ ${expiredSubs.length} subscriptions expired and downgraded.`);
// });

// // src/app/jobs/subscriptionCron.ts

import cron from "node-cron";
import dayjs from "dayjs";
import { prisma } from "../shared/prisma";

let isRunning = false; // Prevent duplicate execution

// Every 1 minute (adjust if needed)
cron.schedule("* * * * *", async () => {
  if (isRunning) {
    console.log("⏳ Subscription cron skipped (already running)");
    return;
  }

  isRunning = true;
  console.log("🔁 Running subscription cron at", new Date().toISOString());

  try {
    const now = new Date();

    // 1️⃣ Find users with EXPIRED subs
    const expiredSubs = await prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lte: now },
      },
    });

    if (expiredSubs.length) {
      console.log(`⚠ Found ${expiredSubs.length} expired subscriptions`);
    }

    // 2️⃣ Deactivate all expired subscriptions
    await prisma.subscription.updateMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lte: now },
      },
      data: {
        status: "EXPIRED",
      },
    });

    // 3️⃣ Optional: create logs for expired subscriptions
    if (expiredSubs.length) {
      const logs = expiredSubs.map((s) => ({
        userId: s.userId,
        subscriptionId: s.id,
        action: "SUBSCRIPTION_EXPIRED",
        timestamp: new Date(),
      }));

      await prisma.subscriptionLog.createMany({ data: logs });

      console.log("📝 Expiration logs stored.");
    }

    // 4️⃣ Optional: Auto-renew logic (if using Stripe or auto payment)
    const autoRenewSubs = await prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        autoRenew: true,
        expiresAt: {
          lte: dayjs(now).add(5, "minute").toDate(), // Renew 5 mins before expiration
        },
      },
    });

    if (autoRenewSubs.length) {
      console.log(`🔄 Auto-renewing ${autoRenewSubs.length} subscriptions...`);
    }

    for (const sub of autoRenewSubs) {
      try {
        // Example auto-renew charge (replace with your method)
        // const payment = await chargeUser(sub.userId, sub.planId);

        const plan = await prisma.subscriptionPlan.findUnique({
          where: { id: sub.planId },
        });

        if (!plan) continue;

        // Create new subscription cycle
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            expiresAt: dayjs(sub.expiresAt)
              .add(plan.durationDays, "day")
              .toDate(),
          },
        });

        // Log renewal
        await prisma.subscriptionLog.create({
          data: {
            userId: sub.userId,
            subscriptionId: sub.id,
            action: "AUTO_RENEWED",
            timestamp: new Date(),
          },
        });

        console.log(`🔁 Auto-renewed subscription for user ${sub.userId}`);
      } catch (renewError) {
        console.error("❌ Auto-renew failed for user", sub.userId, renewError);

        await prisma.subscriptionLog.create({
          data: {
            userId: sub.userId,
            subscriptionId: sub.id,
            action: "AUTO_RENEW_FAILED",
            timestamp: new Date(),
          },
        });
      }
    }

    console.log("✅ Subscription cron completed");
  } catch (error) {
    console.error("❌ Subscription cron failed:", error);
  } finally {
    isRunning = false;
  }
});
