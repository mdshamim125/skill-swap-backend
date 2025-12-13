// controllers/webhook.controller.ts
import { Request, Response } from "express";
import Stripe from "stripe";
import { stripe } from "../helper/stripe";
import { prisma } from "../shared/prisma";
import { PaymentStatus } from "@prisma/client";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
if (!webhookSecret) {
  console.warn(
    "Warning: STRIPE_WEBHOOK_SECRET is not set. Webhook signature verification will fail."
  );
}

// ----------------------
// Stripe Metadata Types
// ----------------------
interface BookingMetadata {
  paymentId: string;
  bookingId?: string;
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
  subscriptionId?: string;
  durationDays: string;
}

type StripeMeta = BookingMetadata | SubscriptionMetadata;

// ----------------------
// Unified handler
// ----------------------
export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string | undefined;
  if (!sig || !webhookSecret) {
    console.error("Webhook misconfigured: missing signature or webhook secret");
    return res.status(400).send("Webhook misconfigured");
  }

  // Ensure we pass a Buffer to stripe.webhooks.constructEvent
  let event: Stripe.Event;
  try {
    const buf = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body));

    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error(
      "Webhook signature verification failed:",
      err?.message || err
    );
    return res.status(400).send(`Webhook Error: ${err?.message || err}`);
  }

  // Quick return for irrelevant events while still logging them
  const supported = ["checkout.session.completed"];
  try {
    // Only handling checkout.session.completed (one-time checkout flows)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("Stripe webhook received checkout.session.completed", {
        sessionId: session.id,
        payment_intent: session.payment_intent,
        metadata: session.metadata,
      });

      try {
        await handleCheckoutSessionCompleted(session);
      } catch (err) {
        console.error("Error processing checkout.session.completed:", err);
        // Return 500 so Stripe will retry the webhook (if you want retries)
        return res.status(500).send("Webhook processing error");
      }
    } else {
      // log other events if you want
      console.log(`Received unsupported event type: ${event.type}`);
    }

    // respond quickly
    return res.json({ received: true });
  } catch (err) {
    console.error("Webhook handler fatal error:", err);
    return res.status(500).send("Server error");
  }
};

// =================================================================
// CHECKOUT SESSION PROCESSOR
// =================================================================
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const meta = session.metadata;

  if (!meta || !meta.paymentId || !meta.purpose) {
    throw new Error("Invalid Stripe metadata");
  }

  // Update payment with success and transaction id (use session.id)
  const payment = await prisma.payment.findUnique({
    where: { id: meta.paymentId },
  });
  if (!payment) {
    console.error("Payment record not found for id", meta.paymentId);
    throw new Error("Payment not found: " + meta.paymentId);
  }

  // Update payment: set SUCCESS and transactionId = session.id
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.SUCCESS,
      transactionId: session.id as string,
      rawResponse: JSON.parse(JSON.stringify(session)),
    },
  });

  const purpose = meta.purpose as "booking" | "subscription" | undefined;
  if (!purpose) {
    console.warn("No purpose in metadata — nothing to route to", {
      metadata: meta,
    });
    return;
  }

  if (meta.purpose === "booking") {
    const bookingMeta: BookingMetadata = {
      paymentId: meta.paymentId,
      purpose: "booking",
      menteeId: meta.menteeId,
      mentorId: meta.mentorId,
      skillId: meta.skillId,
      scheduledAt: meta.scheduledAt,
      durationMin: meta.durationMin,
      price: meta.price,
      bookingId: meta.bookingId,
    };

    await handleBookingFromMetadata(bookingMeta, session);
  }

  if (meta.purpose === "subscription") {
    const subscriptionMeta: SubscriptionMetadata = {
      paymentId: meta.paymentId,
      purpose: "subscription",
      userId: meta.userId,
      planId: meta.planId,
      subscriptionId: meta.subscriptionId,
      durationDays: meta.durationDays,
    };

    await handleSubscriptionFromMetadata(subscriptionMeta, session);
  }
}

// =================================================================
// BOOKING: use metadata.bookingId if available; otherwise find booking by details
// =================================================================
async function handleBookingFromMetadata(
  meta: BookingMetadata,
  session: Stripe.Checkout.Session
) {
  const {
    paymentId,
    bookingId,
    menteeId,
    mentorId,
    skillId,
    scheduledAt,
    durationMin,
    price,
  } = meta;
  console.log("handleBookingFromMetadata:", {
    bookingId,
    paymentId,
    menteeId,
    mentorId,
    skillId,
    scheduledAt,
    durationMin,
    price,
  });

  // If bookingId is present, update that booking (preferred)
  if (bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      console.warn("Booking ID from metadata not found:", bookingId);
    } else {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: "ACCEPTED",
          pricePaid: Number(price || booking.pricePaid || 0),
        },
      });
      console.log("Booking updated (by bookingId):", bookingId);
      return;
    }
  }

  // Fallback: find existing booking by mentee/mentor/skill/date/duration
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
        pricePaid: Number(price || existing.pricePaid || 0),
      },
    });
    console.log("Booking updated (found by fields):", existing.id);
    return;
  }

  // As last resort, create the booking as ACCEPTED
  await prisma.booking.create({
    data: {
      menteeId,
      mentorId,
      skillId,
      scheduledAt: schedule,
      durationMin: Number(durationMin),
      status: "ACCEPTED",
      pricePaid: Number(price || 0),
    },
  });
  console.log(
    "Booking created by webhook fallback (no existing booking found)."
  );
}

// =================================================================
// SUBSCRIPTION: prefer subscriptionId metadata; otherwise find by transactionId
// =================================================================
async function handleSubscriptionFromMetadata(
  meta: SubscriptionMetadata,
  session: Stripe.Checkout.Session
) {
  const { paymentId, userId, planId, subscriptionId, durationDays } = meta;
  console.log("handleSubscriptionFromMetadata:", {
    subscriptionId,
    paymentId,
    userId,
    planId,
    durationDays,
  });

  // Prefer activating the subscription record created earlier
  if (subscriptionId) {
    // Activate by subscription id
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });
    if (!sub) {
      console.error("Pending subscription not found:", subscriptionId);
      throw new Error("Subscription not found: " + subscriptionId);
    }

    // compute expiry: use plan duration if available, otherwise durationDays from metadata
    const planDays =
      sub.plan?.durationDays ?? (durationDays ? Number(durationDays) : 0);
    const now = new Date();
    let base = now;
    if (sub.expiresAt && new Date(sub.expiresAt) > now)
      base = new Date(sub.expiresAt);

    const expiresAt = new Date(base);
    expiresAt.setDate(expiresAt.getDate() + Number(planDays));

    await prisma.$transaction([
      prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: "ACTIVE",
          startedAt: now,
          expiresAt,
          transactionId: session.id as string,
        },
      }),
      prisma.user.update({
        where: { id: sub.userId },
        data: { isPremium: true, premiumExpires: expiresAt },
      }),
      prisma.subscriptionLog.create({
        data: {
          userId: sub.userId,
          subscriptionId: subscriptionId,
          action: `Subscription activated by webhook for ${planDays} day(s)`,
        },
      }),
      // mark payment success if paymentId present
      paymentId
        ? prisma.payment.update({
            where: { id: paymentId },
            data: {
              status: PaymentStatus.SUCCESS,
              transactionId: session.id as string,
            },
          })
        : prisma.$executeRaw`SELECT 1`,
    ]);

    console.log("Subscription activated (by subscriptionId):", subscriptionId);
    return;
  }

  // Fallback: find subscription by transactionId (session.id)
  const subByTx = await prisma.subscription.findUnique({
    where: { transactionId: session.id },
  });
  if (subByTx) {
    // use same activation logic as above
    const planDays = subByTx.planId
      ? (
          await prisma.subscriptionPlan.findUnique({
            where: { id: subByTx.planId },
          })
        )?.durationDays ?? 0
      : Number(durationDays || 0);
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + Number(planDays));

    await prisma.$transaction([
      prisma.subscription.update({
        where: { id: subByTx.id },
        data: { status: "ACTIVE", startedAt: now, expiresAt },
      }),
      prisma.user.update({
        where: { id: subByTx.userId },
        data: { isPremium: true, premiumExpires: expiresAt },
      }),
      prisma.subscriptionLog.create({
        data: {
          userId: subByTx.userId,
          subscriptionId: subByTx.id,
          action: `Subscription activated by webhook (fallback)`,
        },
      }),
      paymentId
        ? prisma.payment.update({
            where: { id: paymentId },
            data: {
              status: PaymentStatus.SUCCESS,
              transactionId: session.id as string,
            },
          })
        : prisma.$executeRaw`SELECT 1`,
    ]);

    console.log(
      "Subscription activated (by transactionId fallback):",
      subByTx.id
    );
    return;
  }

  // If nothing found, as last option create subscription (not recommended but safe)
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });
  if (!plan) {
    console.error("Subscription plan not found (fallback create):", planId);
    throw new Error("Subscription plan not found");
  }

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(
    expiresAt.getDate() + Number(durationDays || plan.durationDays || 0)
  );

  const created = await prisma.subscription.create({
    data: {
      userId,
      planId,
      status: "ACTIVE",
      startedAt: now,
      expiresAt,
      transactionId: session.id as string,
    },
  });

  await prisma.subscriptionLog.create({
    data: {
      userId,
      subscriptionId: created.id,
      action: `Subscription created by webhook fallback`,
    },
  });

  if (paymentId) {
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.SUCCESS,
        transactionId: session.id as string,
      },
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isPremium: true, premiumExpires: expiresAt },
  });

  console.log("Subscription created by webhook fallback:", created.id);
}
