// src/app/modules/subscription/subscription.service.ts
import { stripe } from "../../helper/stripe";
import { prisma } from "../../shared/prisma";

export const paymentService = {
  createSubscription: async (userId: string, planId: string) => {
    // 1. Validate user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, isPremium: true, premiumExpires: true },
    });
    if (!user) throw new Error("Unauthorized user");

    // 2. Check if user is already premium
    const isPremiumValid =
      user.isPremium &&
      user.premiumExpires &&
      new Date(user.premiumExpires) > new Date();
    if (isPremiumValid) {
      throw new Error(
        `You already have an active premium plan until ${user.premiumExpires}`
      );
    }

    // 3. Find plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new Error("Subscription plan not found");

    // 4. Start DB transaction for subscription + payment
    let subscription, payment;
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create subscription (PENDING)
        const sub = await tx.subscription.create({
          data: {
            userId,
            planId,
            status: "PENDING",
            expiresAt: new Date(
              Date.now() + plan.durationDays * 24 * 60 * 60 * 1000
            ),
          },
        });

        // Create payment (PENDING)
        const pay = await tx.payment.create({
          data: {
            userId,
            amount: plan.price,
            currency: "USD",
            purpose: `${plan.name} Subscription`,
            status: "PENDING",
          },
        });

        return { sub, pay };
      });

      subscription = result.sub;
      payment = result.pay;
    } catch (err) {
      console.error("DB transaction failed:", err);
      throw new Error("Could not create subscription or payment");
    }

    // 5. Create Stripe session
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: user.email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `${plan.name} Subscription`,
                description: `${plan.durationDays} days of premium access`,
              },
              unit_amount: plan.price * 100,
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId,
          planId,
          subscriptionId: subscription.id,
          paymentId: payment.id,
        },
        success_url: `${process.env.SUCCESS_URL}/payment-success`,
        cancel_url: `${process.env.CANCEL_URL}/payment-cancel`,
      });
    } catch (err) {
      console.error("Stripe session creation failed:", err);

      // Rollback DB manually if Stripe fails
      await prisma.$transaction([
        prisma.subscription.delete({ where: { id: subscription.id } }),
        prisma.payment.delete({ where: { id: payment.id } }),
      ]);

      throw new Error("Failed to initiate payment session");
    }

    // 6. Update subscription and payment with Stripe session ID
    await prisma.$transaction([
      prisma.subscription.update({
        where: { id: subscription.id },
        data: { transactionId: session.id },
      }),
      prisma.payment.update({
        where: { id: payment.id },
        data: { transactionId: session.id },
      }),
    ]);

    return { paymentUrl: session.url };
  },

  activateSubscription: async (transactionId: string) => {
    return await prisma.$transaction(async (tx) => {
      // find subscription by transactionId
      const subscription = await tx.subscription.findUnique({
        where: { transactionId },
        include: { plan: true },
      });
      if (!subscription)
        throw new Error(
          "Subscription not found for transactionId: " + transactionId
        );

      // compute new expiry using plan duration (if plan exists)
      const planDays = subscription.plan?.durationDays ?? 0;
      const newExpiry = new Date(Date.now() + planDays * 24 * 60 * 60 * 1000);

      // mark subscription ACTIVE
      await tx.subscription.update({
        where: { id: subscription.id },
        data: { status: "ACTIVE", startedAt: new Date(), expiresAt: newExpiry },
      });

      // mark user premium
      await tx.user.update({
        where: { id: subscription.userId },
        data: { isPremium: true, premiumExpires: newExpiry },
      });

      // upsert payment (mark success)
      await tx.payment.upsert({
        where: { transactionId },
        update: { status: "SUCCESS" },
        create: {
          userId: subscription.userId,
          amount: subscription.plan?.price ?? 0,
          currency: "USD",
          purpose: `${subscription.plan?.name ?? "Subscription"} Subscription`,
          transactionId,
          status: "SUCCESS",
        },
      });

      // create subscription log entry
      await tx.subscriptionLog.create({
        data: {
          userId: subscription.userId,
          subscriptionId: subscription.id,
          action: "ACTIVATED_BY_WEBHOOK",
        },
      });

      return true;
    });
  },

  cancelSubscription: async (subscriptionId: string) => {
    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: "CANCELLED" },
    });

    await prisma.user.update({
      where: { id: subscription.userId },
      data: { isPremium: false, premiumExpires: null },
    });

    return subscription;
  },
};
