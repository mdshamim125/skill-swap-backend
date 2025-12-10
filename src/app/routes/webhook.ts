// routes/webhook.ts
import express from "express";
import { handleStripeWebhook } from "./webhook.controller";

const router = express.Router();

router.post("/", handleStripeWebhook);

export const webhookRouter = router;
