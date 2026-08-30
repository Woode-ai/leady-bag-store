// src/app/api/payment/webhook/route.ts
// POST /api/payment/webhook
// Ù‡Ø°Ø§ Ø§Ù„Ø±Ø§Ø¨Ø· Ù„Ø§ ÙŠØ³ØªØ¯Ø¹ÙŠÙ‡ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø£Ø¨Ø¯Ø§Ù‹ - Ø¨Ù„ Stripe Ù†ÙØ³Ù‡ ÙŠØ³ØªØ¯Ø¹ÙŠÙ‡ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹
// Ø¹Ù†Ø¯Ù…Ø§ ÙŠÙƒØªÙ…Ù„ Ø§Ù„Ø¯ÙØ¹ Ø¨Ù†Ø¬Ø§Ø­ØŒ Ù„ÙŠØ®Ø¨Ø±Ù†Ø§ "Ù‡Ø°Ø§ Ø§Ù„Ø·Ù„Ø¨ ØªÙ… Ø¯ÙØ¹Ù‡ ÙØ¹Ù„ÙŠØ§Ù‹"
// Ù†Ø³ØªØ®Ø¯Ù… Ù‡Ø°Ø§ Ø¨Ø¯Ù„Ø§Ù‹ Ù…Ù† Ø§Ù„Ø«Ù‚Ø© ÙÙŠ Ø§Ù„Ù…ØªØµÙØ­ØŒ Ù„Ø£Ù† Ø§Ù„Ù…ØªØµÙØ­ ÙŠÙ…ÙƒÙ† Ø§Ù„ØªÙ„Ø§Ø¹Ø¨ Ø¨Ù‡ØŒ Ø£Ù…Ø§ Stripe ÙÙ…ÙˆØ«ÙˆÙ‚

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature") as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

    let event;
    try {
      // Ù†ØªØ£ÙƒØ¯ Ø£Ù† Ù‡Ø°Ø§ Ø§Ù„Ø·Ù„Ø¨ ÙØ¹Ù„Ø§Ù‹ Ù…Ù† Stripe ÙˆÙ„ÙŠØ³ Ù…Ø²ÙˆÙ‘Ø±Ø§Ù‹ Ù…Ù† Ø£ÙŠ Ø´Ø®Øµ Ø¢Ø®Ø±
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: unknown) {
      return NextResponse.json(
        { status: "error", message: `Ø®Ø·Ø£ ÙÙŠ ØªÙˆÙ‚ÙŠØ¹ Ø§Ù„Ù€ Webhook: ${(err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err))}` },
        { status: 400 }
      );
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const orderId = session.metadata?.orderId;

      if (!orderId || session.payment_status !== "paid") {
        return NextResponse.json({ received: true });
      }

      await connectDB();
      const order = await Order.findById(orderId);

      if (!order) {
        return NextResponse.json({ status: "error", message: "Ø§Ù„Ø·Ù„Ø¨ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯" }, { status: 400 });
      }

      const expectedAmount = Math.round(order.total * 100);
      const receivedAmount = Number(session.amount_total);
      const receivedCurrency = String(session.currency || "").toLowerCase();

      if (
        receivedAmount !== expectedAmount ||
        receivedCurrency !== "usd"
      ) {
        return NextResponse.json(
          { status: "error", message: "Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¯ÙØ¹ Ù„Ø§ ØªØ·Ø§Ø¨Ù‚ Ù‚ÙŠÙ…Ø© Ø§Ù„Ø·Ù„Ø¨" },
          { status: 400 }
        );
      }

      if (order.paymentStatus !== "paid") {
        order.paymentStatus = "paid";
        if (order.status === "pending") order.status = "processing";
        await order.save();
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


