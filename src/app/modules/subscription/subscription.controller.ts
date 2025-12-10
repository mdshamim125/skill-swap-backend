// src/app/modules/subscription/subscription.controller.ts
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { paymentService } from "./subscription.service";
import { stripe } from "../../helper/stripe";
import Stripe from "stripe";

export const subscriptionController = {
  createSubscription: catchAsync(async (req: Request, res: Response) => {
    const { planId } = req.body;
    const userId = req.user?.id;
    console.log(planId, userId);
    if (!userId) throw new Error("Unauthorized user");

    const result = await paymentService.createSubscription(userId, planId);
    console.log(result);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Subscription created. Redirect to payment URL.",
      data: result,
    });
  }),

  stripeWebhook: async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string | undefined;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    if (!sig || !webhookSecret) {
      console.error("Missing stripe signature or webhook secret");
      return res.status(400).send("Missing stripe signature or webhook secret");
    }

    let event: Stripe.Event;
    try {
      // req.body is raw here because of express.raw in the route
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error("⚠️  Webhook signature verification failed.", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      // Only handling checkout.session.completed for one-time checkout
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        // session.id is used as transaction id stored earlier
        await paymentService.activateSubscription(session.id);
      }

      // respond quickly to Stripe
      res.json({ received: true });
    } catch (err) {
      console.error("Error handling webhook:", err);
      // Respond 500 so Stripe can retry
      res.status(500).send("Webhook handler error");
    }
  },

  cancelSubscription: catchAsync(async (req: Request, res: Response) => {
    const subscriptionId = req.params.subscriptionId;
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
