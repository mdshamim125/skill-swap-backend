// subscription.routes.ts
import express from "express";
import auth from "../../middlewares/auth";
import { paymentService } from "./payment.service";
import { stripeWebhook } from "./payment.controller";

const router = express.Router();

// Create Stripe Checkout session
router.post("/create-session", auth(), async (req, res) => {
  const { planId, successUrl, cancelUrl } = req.body;
  const session = await paymentService.createPaymentSession(
    req.user!.id,
    planId,
    successUrl,
    cancelUrl
  );
  res.json({ sessionId: session.id, url: session.url });
});

// Stripe webhook endpoint
router.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook);

export const paymentRoutes = router;
