// routes/webhook.ts
import express from "express";
import { handleStripeWebhook } from "./webhook.controller";

const router = express.Router();

router.post("/", handleStripeWebhook);

export const webhookRouter = router;

// import express from "express";
// import { handleStripeWebhook } from "./controllers/webhook.controller";

// app.post(
//   "/webhook",
//   express.raw({ type: "application/json" }),
//   handleStripeWebhook
// );
