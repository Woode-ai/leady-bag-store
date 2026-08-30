// src/lib/stripe.ts
// Ø¥Ø¹Ø¯Ø§Ø¯ Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ø®Ø¯Ù…Ø© Ø§Ù„Ø¯ÙØ¹ Stripe

import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;

export const stripe = new Stripe(STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-08-26.dahlia",
});


