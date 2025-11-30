// helper/stripeHelper.ts
import { stripe } from "./stripe";

export const createCheckoutSession = async (
  userEmail: string,
  planStripePriceId: string,
  successUrl: string,
  cancelUrl: string
) => {
  return stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: userEmail,
    line_items: [{ price: planStripePriceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
};
