// src/app/api/payment/stripe/route.ts
// POST /api/payment/stripe
// ÙŠÙ†Ø´Ø¦ "Ø¬Ù„Ø³Ø© Ø¯ÙØ¹" (Checkout Session) Ø¹Ù„Ù‰ Stripe Ù„Ø·Ù„Ø¨ Ù…ÙˆØ¬ÙˆØ¯ Ø¨Ø§Ù„ÙØ¹Ù„
// ÙŠØ¹ÙŠØ¯ Ø±Ø§Ø¨Ø· ØµÙØ­Ø© Ø§Ù„Ø¯ÙØ¹ Ø§Ù„Ø®Ø§ØµØ© Ø¨Ù€ Stripe Ù„ÙŠØªÙ… ØªÙˆØ¬ÙŠÙ‡ Ø§Ù„Ø¹Ù…ÙŠÙ„ Ø¥Ù„ÙŠÙ‡Ø§

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { getCurrentUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const currentUser = getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json(
        { status: "error", message: "ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„" },
        { status: 401 }
      );
    }

    await connectDB();
    const { orderId } = await req.json();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ status: "error", message: "Ø§Ù„Ø·Ù„Ø¨ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯" }, { status: 404 });
    }

    if (order.userId.toString() !== currentUser.userId) {
      return NextResponse.json(
        { status: "error", message: "ØºÙŠØ± Ù…ØµØ±Ø­ Ù„Ùƒ Ø¨Ø¯ÙØ¹ Ù‡Ø°Ø§ Ø§Ù„Ø·Ù„Ø¨" },
        { status: 403 }
      );
    }

    // Ù†Ù†Ø´Ø¦ Ø¬Ù„Ø³Ø© Ø¯ÙØ¹ Ø¨Ù‚ÙŠÙ…Ø© Ø§Ù„Ø·Ù„Ø¨ Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠØ© (Stripe ÙŠØªØ¹Ø§Ù…Ù„ Ø¨Ø§Ù„Ø³Ù†ØªØŒ Ù„Ø°Ù„Ùƒ Ù†Ø¶Ø±Ø¨ Ã— 100)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd", // ØºÙŠÙ‘Ø±Ù‡Ø§ Ù„Ø¹Ù…Ù„ØªÙƒ Ø§Ù„Ù…Ø­Ù„ÙŠØ© Ø¥Ù† ÙƒØ§Ù†Øª Ù…Ø¯Ø¹ÙˆÙ…Ø© Ù…Ù† Stripe
            product_data: { name: `Ø·Ù„Ø¨ leadybag Ø±Ù‚Ù… ${order.trackingNumber}` },
            unit_amount: Math.round(order.total * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { orderId: order._id.toString() }, // Ù†Ø­ØªØ§Ø¬Ù‡Ø§ Ù„Ø§Ø­Ù‚Ø§Ù‹ ÙÙŠ Ø§Ù„Ù€ webhook Ù„Ù…Ø¹Ø±ÙØ© Ø£ÙŠ Ø·Ù„Ø¨ ØªÙ… Ø¯ÙØ¹Ù‡
      success_url: `${process.env.NEXTAUTH_URL}/order-success?orderId=${order._id}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/checkout?cancelled=true`,
    });

    return NextResponse.json({ status: "success", checkoutUrl: session.url });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "ÙØ´Ù„ Ø¥Ù†Ø´Ø§Ø¡ Ø¬Ù„Ø³Ø© Ø§Ù„Ø¯ÙØ¹", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


