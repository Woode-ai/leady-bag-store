// src/app/api/payment/paymob/route.ts
// POST /api/payment/paymob
// PayMob Ø¨ÙˆØ§Ø¨Ø© Ø¯ÙØ¹ Ø¹Ø±Ø¨ÙŠØ© Ø´Ù‡ÙŠØ±Ø© (ØªØ¯Ø¹Ù… Ø¨Ø·Ø§Ù‚Ø§Øª ÙÙŠØ²Ø§/Ù…Ø§Ø³ØªØ±ÙƒØ§Ø±Ø¯ ÙˆÙ…Ø­Ø§ÙØ¸ Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ©)
// Ø¢Ù„ÙŠØ© Ø¹Ù…Ù„Ù‡Ø§ ØªØ®ØªÙ„Ù Ø¹Ù† Stripe: ØªØ­ØªØ§Ø¬ 3 Ø®Ø·ÙˆØ§Øª Ù…ØªØªØ§Ù„ÙŠØ© (Ø·Ù„Ø¨ ØªÙˆÙƒÙ† â†’ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø·Ù„Ø¨ â†’ Ø·Ù„Ø¨ Ø±Ø§Ø¨Ø· Ø§Ù„Ø¯ÙØ¹)

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { getCurrentUser } from "@/lib/auth";

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;

export async function POST(req: NextRequest) {
  try {
    const currentUser = getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json(
        { status: "error", message: "ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„" },
        { status: 401 }
      );
    }

    if (!PAYMOB_API_KEY || !PAYMOB_INTEGRATION_ID || !PAYMOB_IFRAME_ID) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª PayMob ØºÙŠØ± Ù…ÙƒØªÙ…Ù„Ø© - Ø£Ø¶Ù PAYMOB_API_KEY Ùˆ PAYMOB_INTEGRATION_ID Ùˆ PAYMOB_IFRAME_ID ÙÙŠ .env.local",
        },
        { status: 500 }
      );
    }

    await connectDB();
    const { orderId } = await req.json();
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ status: "error", message: "Ø§Ù„Ø·Ù„Ø¨ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯" }, { status: 404 });
    }

    // Ù†ØªØ£ÙƒØ¯ Ø£Ù† Ù‡Ø°Ø§ Ø§Ù„Ø·Ù„Ø¨ ÙŠØ®Øµ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø§Ù„Ø­Ø§Ù„ÙŠ ÙØ¹Ù„Ø§Ù‹ - ÙˆØ¥Ù„Ø§ ÙŠØ³ØªØ·ÙŠØ¹ Ø£ÙŠ Ø¹Ù…ÙŠÙ„ Ù…Ø³Ø¬Ù‘Ù„ Ø¯Ø®ÙˆÙ„Ù‡
    // Ø¨Ø¯Ø¡ Ø¬Ù„Ø³Ø© Ø¯ÙØ¹ Ù„Ø£ÙŠ Ø±Ù‚Ù… Ø·Ù„Ø¨ ÙŠØ®Ù…Ù‘Ù†Ù‡ (Ø­ØªÙ‰ Ù„Ùˆ Ù„Ù… ÙŠÙƒÙ† Ø·Ù„Ø¨Ù‡ Ù‡Ùˆ)
    if (order.userId.toString() !== currentUser.userId) {
      return NextResponse.json(
        { status: "error", message: "ØºÙŠØ± Ù…ØµØ±Ø­ Ù„Ùƒ Ø¨Ø¯ÙØ¹ Ù‡Ø°Ø§ Ø§Ù„Ø·Ù„Ø¨" },
        { status: 403 }
      );
    }

    // Ø§Ù„Ø®Ø·ÙˆØ© 1: Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ ØªÙˆÙƒÙ† Ù…ØµØ§Ø¯Ù‚Ø© Ù…Ù† PayMob
    const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: PAYMOB_API_KEY }),
    });
    const authData = await authRes.json();
    const authToken = authData.token;

    // Ø§Ù„Ø®Ø·ÙˆØ© 2: ØªØ³Ø¬ÙŠÙ„ ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ø·Ù„Ø¨ Ù„Ø¯Ù‰ PayMob (Ø§Ù„Ù…Ø¨Ù„Øº Ø¨Ø§Ù„Ù‚Ø±ÙˆØ´/Ø§Ù„Ø³Ù†Øª)
    const orderRes = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: Math.round(order.total * 100),
        currency: "EGP", // ØºÙŠÙ‘Ø±Ù‡Ø§ Ø­Ø³Ø¨ Ø¹Ù…Ù„ØªÙƒ
        items: [],
      }),
    });
    const orderData = await orderRes.json();

    // Ø§Ù„Ø®Ø·ÙˆØ© 3: Ø·Ù„Ø¨ "Ù…ÙØªØ§Ø­ Ø¯ÙØ¹" (payment_key) Ø®Ø§Øµ Ø¨Ù‡Ø°Ø§ Ø§Ù„Ø·Ù„Ø¨ Ù„Ø¹Ø±Ø¶ ØµÙØ­Ø© Ø§Ù„Ø¯ÙØ¹
    const paymentKeyRes = await fetch(
      "https://accept.paymob.com/api/acceptance/payment_keys",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_token: authToken,
          amount_cents: Math.round(order.total * 100),
          expiration: 3600,
          order_id: orderData.id,
          billing_data: {
            apartment: "NA",
            email: "customer@leadybag.com",
            floor: "NA",
            first_name: "Ø¹Ù…ÙŠÙ„",
            street: "NA",
            building: "NA",
            phone_number: "01000000000",
            city: "Khartoum",
            country: "SD",
            last_name: "leadybag",
            state: "NA",
          },
          currency: "EGP",
          integration_id: PAYMOB_INTEGRATION_ID,
        }),
      }
    );
    const paymentKeyData = await paymentKeyRes.json();

    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentKeyData.token}`;

    return NextResponse.json({ status: "success", checkoutUrl: iframeUrl });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "ÙØ´Ù„ Ø¥Ù†Ø´Ø§Ø¡ Ø¬Ù„Ø³Ø© Ø§Ù„Ø¯ÙØ¹ Ø¹Ø¨Ø± PayMob", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


