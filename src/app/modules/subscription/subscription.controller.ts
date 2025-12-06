// src/app/modules/subscription/subscription.controller.ts

import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { paymentService } from "./subscription.service";
import { stripe } from "../../helper/stripe";
import Stripe from "stripe";

export const subscriptionController = {
  // -----------------------------------------------------
  // 1. Create subscription → returns Stripe payment URL
  // -----------------------------------------------------
  createSubscription: catchAsync(async (req: Request, res: Response) => {
    const { planId } = req.body;
    const userId = req.user?.id; // from auth middleware

    if (!userId) {
      throw new Error("Unauthorized user");
    }

    const result = await paymentService.createSubscription(userId, planId);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Subscription created. Redirect to payment URL.",
      data: result,
    });
  }),

  // -----------------------------------------------------
  // 2. Stripe webhook → activate subscription
  // -----------------------------------------------------
  stripeWebhook: async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await paymentService.activateSubscription(session.id);
    }

    res.json({ received: true });
  },

  // -----------------------------------------------------
  // 3. Cancel subscription (admin or user)
  // -----------------------------------------------------
  cancelSubscription: catchAsync(async (req: Request, res: Response) => {
    const { subscriptionId } = req.params;

    const result = await paymentService.cancelSubscription(subscriptionId);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Subscription cancelled successfully",
      data: result,
    });
  }),
};

// Use your Stripe webhook secret from config
// const webhookSecret = config.stripeWebhookSecret as string;

// export const stripeWebhook = async (req: Request, res: Response) => {
//   const sig = req.headers["stripe-signature"] as string;

//   let event: Stripe.Event;
//   try {
//     // req.body must be raw (see express.raw() in route)
//     event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
//   } catch (err: any) {
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   if (event.type === "checkout.session.completed") {
//     const session = event.data.object as Stripe.Checkout.Session;
//     if (session.id) {
//       await paymentService.activateSubscription(session.id);
//     }
//   }

//   res.json({ received: true });
// };
