// subscription.service.ts
import { prisma } from "../../shared/prisma";
import { createCheckoutSession } from "../../helper/stripeHelper";

export const paymentService = {
  // Create Stripe checkout session
  createPaymentSession: async (
    userId: string,
    planId: string,
    successUrl: string,
    cancelUrl: string
  ) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!user || !plan) throw new Error("User or plan not found");

    // Use Stripe price ID mapped to plan.id
    const stripeSession = await createCheckoutSession(
      user.email,
      plan.id, // ideally map plan.id to Stripe Price ID
      successUrl,
      cancelUrl
    );

    // Save subscription record in DB as PENDING
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        status: "ACTIVE", // PENDING if you want to activate only after payment webhook
        expiresAt: new Date(
          Date.now() + plan.durationDays * 24 * 60 * 60 * 1000
        ),
        transactionId: stripeSession.id,
      },
    });

    return stripeSession;
  },

  // Activate subscription via webhook
  activateSubscription: async (transactionId: string) => {
    const subscription = await prisma.subscription.findUnique({
      where: { transactionId },
      include: { user: true, plan: true },
    });
    if (!subscription) throw new Error("Subscription not found");

    const expiresAt = new Date(
      Date.now() + subscription.plan.durationDays * 24 * 60 * 60 * 1000
    );

    // Update subscription & user
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "ACTIVE", expiresAt },
    });

    await prisma.user.update({
      where: { id: subscription.userId },
      data: { isPremium: true, premiumExpires: expiresAt },
    });
  },

  cancelSubscription: async (subscriptionId: string) => {
    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: "CANCELLED" },
    });

    // Optionally downgrade user if needed
    await prisma.user.update({
      where: { id: subscription.userId },
      data: { isPremium: false, premiumExpires: null },
    });

    return subscription;
  },
};
