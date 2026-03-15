import Stripe from "stripe";

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY environment variable is not set. Connect the Stripe integration to configure it."
    );
  }
  return new Stripe(secretKey, { apiVersion: "2024-06-20" });
}
