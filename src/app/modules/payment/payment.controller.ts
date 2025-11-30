// subscription.controller.ts
import { Request, Response } from "express";
import { stripe } from "../../helper/stripe";
import { paymentService } from "./payment.service";
import Stripe from "stripe";
import config from "../../../config";

// Use your Stripe webhook secret from config
const webhookSecret = config.stripeWebhookSecret as string;

export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;
  try {
    // req.body must be raw (see express.raw() in route)
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.id) {
      await paymentService.activateSubscription(session.id);
    }
  }

  res.json({ received: true });
};

// import { stripe } from "../../helper/stripe";
// import { prisma } from "../../shared/prisma";

// export const stripeWebhook = async (req: Request, res: Response)=> {
//   const sig = req.headers["stripe-signature"] as string;

//   let event;
//   try {
//     event = stripe.webhooks.constructEvent(
//       req.body,
//       sig,
//       process.env.STRIPE_WEBHOOK_SECRET!
//     );
//   } catch (err: any) {
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   if (event.type === "checkout.session.completed") {
//     const session = event.data.object;

//     const metadata = session.metadata;

//     const {
//       menteeId,
//       mentorId,
//       skillId,
//       scheduledAt,
//       durationMin,
//       paymentId,
//     } = metadata;

//     // 1️⃣ Mark payment successful
//     await prisma.payment.update({
//       where: { id: paymentId },
//       data: { status: "SUCCESS" },
//     });

//     // 2️⃣ Create booking now
//     await prisma.booking.create({
//       data: {
//         menteeId,
//         mentorId,
//         skillId,
//         scheduledAt: new Date(scheduledAt),
//         durationMin: Number(durationMin),
//         status: "PENDING",
//       },
//     });
//   }

//   res.json({ received: true });
// };
