// subscription.service.ts
import { stripe } from "../../helper/stripe";
import { prisma } from "../../shared/prisma";

export const paymentService = {
  // -------------------------------------------------------------------
  // 1. CREATE SUBSCRIPTION (USER or MENTOR)
  // -------------------------------------------------------------------
  createSubscription: async (userId: string, planId: string) => {
    // -------------------------------------
    // Validate user
    // -------------------------------------
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        isPremium: true,
        premiumExpires: true,
      },
    });

    if (!user) throw new Error("Unauthorized user");

    // Premium validity
    const isPremiumValid =
      user.isPremium &&
      user.premiumExpires &&
      new Date(user.premiumExpires) > new Date();

    if (isPremiumValid) {
      throw new Error(
        `You already have an active premium plan until ${user.premiumExpires}`
      );
    }

    // -------------------------------------
    // Find plan
    // -------------------------------------
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) throw new Error("Subscription plan not found");

    // -------------------------------------
    // Create subscription entry (PENDING)
    // -------------------------------------
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        status: "PENDING",
        expiresAt: new Date(
          Date.now() + plan.durationDays * 24 * 60 * 60 * 1000
        ),
      },
    });

    // -------------------------------------
    // Stripe Checkout Session
    // -------------------------------------
    const session = await stripe.checkout.sessions.create({
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
            unit_amount: plan.price * 100, // Stripe requires cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        planId,
        subscriptionId: subscription.id,
      },
      success_url: `${process.env.SUCCESS_URL}/payment-success`,
      cancel_url: `${process.env.CANCEL_URL}/payment-cancel`,
    });

    // Save transactionId
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { transactionId: session.id },
    });

    return { paymentUrl: session.url };
  },

  // -------------------------------------------------------------------
  // 2. ACTIVATE SUBSCRIPTION (via Stripe Webhook)
  // -------------------------------------------------------------------
  activateSubscription: async (transactionId: string) => {
    const subscription = await prisma.subscription.findUnique({
      where: { transactionId },
      include: { user: true, plan: true },
    });

    if (!subscription) throw new Error("Subscription not found");

    const newExpiry = new Date(
      Date.now() + subscription.plan.durationDays * 24 * 60 * 60 * 1000
    );

    // Activate subscription
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "ACTIVE",
        expiresAt: newExpiry,
      },
    });

    // Upgrade user to premium
    await prisma.user.update({
      where: { id: subscription.userId },
      data: {
        isPremium: true,
        premiumExpires: newExpiry,
      },
    });

    return true;
  },

  // -------------------------------------------------------------------
  // 3. CANCEL SUBSCRIPTION
  // -------------------------------------------------------------------
  cancelSubscription: async (subscriptionId: string) => {
    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: "CANCELLED" },
    });

    // OPTIONAL: downgrade user
    await prisma.user.update({
      where: { id: subscription.userId },
      data: {
        isPremium: false,
        premiumExpires: null,
      },
    });

    return subscription;
  },
};
