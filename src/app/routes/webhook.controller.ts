// controllers/webhook.controller.ts
import { Request, Response } from "express";
import Stripe from "stripe";
import { stripe } from "../helper/stripe";
import { prisma } from "../shared/prisma";
import { PaymentStatus } from "@prisma/client";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// ----------------------
// Stripe Metadata Types
// ----------------------
interface BookingMetadata {
  paymentId: string;
  purpose: "booking";
  menteeId: string;
  mentorId: string;
  skillId: string;
  scheduledAt: string;
  durationMin: string;
  price: string;
}

interface SubscriptionMetadata {
  paymentId: string;
  purpose: "subscription";
  userId: string;
  planId: string;
  durationDays: string;
}

type StripeMeta = BookingMetadata | SubscriptionMetadata;

// ----------------------
export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string | undefined;

  if (!sig || !webhookSecret) {
    return res.status(400).send("Webhook misconfigured");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      webhookSecret
    );
  } catch (err: any) {
    console.error("Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutSessionCompleted(session);
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return res.status(500).send("Server error");
  }
};

// =================================================================
// CHECKOUT SESSION PROCESSOR
// =================================================================
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  // Convert safely
  const meta = session.metadata as unknown as Record<string, string> | null;

  if (!meta || !meta.paymentId) {
    throw new Error("Missing metadata.paymentId");
  }

  // Fallback safety
  const purpose = meta.purpose as "booking" | "subscription";

  const payment = await prisma.payment.findUnique({
    where: { id: meta.paymentId },
  });

  if (!payment) throw new Error("Payment not found: " + meta.paymentId);

  // Update payment
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.SUCCESS,
      transactionId: session.payment_intent as string,
      rawResponse: JSON.parse(JSON.stringify(session)), // FIXED
    },
  });

  // Route based on purpose
  if (purpose === "booking") {
    await processBooking(meta as unknown as BookingMetadata);
  } else if (purpose === "subscription") {
    const subscriptionMeta: SubscriptionMetadata = {
      paymentId: meta.paymentId,
      purpose: meta.purpose as "subscription",
      userId: meta.userId,
      planId: meta.planId,
      durationDays: meta.durationDays,
    };
    await processSubscription(subscriptionMeta, session);
  }
}

// =================================================================
// BOOKING PROCESSOR
// =================================================================
async function processBooking(meta: BookingMetadata) {
  const { menteeId, mentorId, skillId, scheduledAt, durationMin, price } = meta;

  console.log(
    "meta:",
    meta,
    "menteeId:",
    menteeId,
    "mentorId:",
    mentorId,
    "skillId:",
    skillId,
    "scheduledAt:",
    scheduledAt,
    "durationMin:",
    durationMin,
    "price:",
    price
  );

  const schedule = new Date(scheduledAt);

  const existing = await prisma.booking.findFirst({
    where: {
      menteeId,
      mentorId,
      skillId,
      scheduledAt: schedule,
      durationMin: Number(durationMin),
    },
  });

  if (existing) {
    await prisma.booking.update({
      where: { id: existing.id },
      data: {
        status: "ACCEPTED",
        pricePaid: Number(price),
      },
    });
    return;
  }

  // Create booking
  await prisma.booking.create({
    data: {
      menteeId,
      mentorId,
      skillId,
      scheduledAt: schedule,
      durationMin: Number(durationMin),
      status: "ACCEPTED",
      pricePaid: Number(price),
    },
  });
}

// =================================================================
// SUBSCRIPTION PROCESSOR
// =================================================================
async function processSubscription(
  meta: SubscriptionMetadata,
  session: Stripe.Checkout.Session
) {
  const { userId, planId, durationDays } = meta;

  console.log(
    "meta:",
    meta,
    "session:",
    session,
    "user:",
    userId,
    "planId: ",
    planId,
    "durationDays:",
    durationDays
  );

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) throw new Error("Subscription plan not found");

  const now = new Date();

  const existing = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
    },
  });

  let base = now;

  if (existing && new Date(existing.expiresAt) > now) {
    base = new Date(existing.expiresAt);
  }

  const expiresAt = new Date(base);
  expiresAt.setDate(expiresAt.getDate() + Number(durationDays));

  // Create subscription
  const subscription = await prisma.subscription.create({
    data: {
      userId,
      planId,
      status: "ACTIVE",
      startedAt: now,
      expiresAt,
      transactionId: session.payment_intent as string,
    },
  });

  // Create log
  await prisma.subscriptionLog.create({
    data: {
      userId,
      subscriptionId: subscription.id,
      action: `Subscription purchased for ${durationDays} day(s)`,
    },
  });

  // Update user
  await prisma.user.update({
    where: { id: userId },
    data: {
      isPremium: true,
      premiumExpires: expiresAt,
    },
  });
}
