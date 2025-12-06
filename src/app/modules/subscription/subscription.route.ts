// src/app/modules/subscription/subscription.route.ts

import express from "express";
import { subscriptionController } from "./subscription.controller";
import auth from "../../middlewares/auth";
import { Role } from "@prisma/client";

// OPTIONAL: Attach real auth middleware
// import auth from "../../middlewares/auth";

const router = express.Router();

// ------------------------------
// 1. Create subscription
// ------------------------------
// router.post("/create", auth(), subscriptionController.createSubscription);

router.post(
  "/create",
  auth(Role.USER, Role.MENTOR),
  subscriptionController.createSubscription
);

// ------------------------------
// 2. Stripe webhook
// Stripe requires raw body parsing, remember in server.ts:
// app.post("/api/subscription/webhook", express.raw({ type: "application/json" }), controller)
// ------------------------------
// router.post("/webhook", subscriptionController.stripeWebhook);

// ------------------------------
// 3. Cancel subscription
// ------------------------------
// router.patch("/cancel/:subscriptionId", auth(), subscriptionController.cancelSubscription);

router.patch(
  "/cancel/:subscriptionId",
  subscriptionController.cancelSubscription
);

// Stripe webhook endpoint
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  subscriptionController.stripeWebhook
);

export const subscriptionRoute = router;
