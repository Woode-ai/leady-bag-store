// src/app/api/coupons/validate/route.ts
// POST /api/coupons/validate
// ÙŠØªØ­Ù‚Ù‚ Ù‡Ù„ Ø§Ù„ÙƒÙˆØ¨ÙˆÙ† ØµØ§Ù„Ø­ Ù„Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ø¢Ù† (ØªØ§Ø±ÙŠØ® Ø³Ø§Ø±ÙŠ + Ù„Ù… ÙŠØªØ¬Ø§ÙˆØ² Ø­Ø¯ Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù…)
// ÙŠØ³ØªØ®Ø¯Ù…Ù‡ Ø§Ù„Ø¹Ù…ÙŠÙ„ Ø¹Ù†Ø¯ ÙƒØªØ§Ø¨Ø© ÙƒÙˆØ¯ Ø§Ù„Ø®ØµÙ… ÙÙŠ ØµÙØ­Ø© Ø§Ù„Ø³Ù„Ø©

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Coupon from "@/models/Coupon";
import { getCurrentUser } from "@/lib/auth";

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
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { status: "error", message: "ÙŠØ¬Ø¨ Ø¥Ø¯Ø®Ø§Ù„ ÙƒÙˆØ¯ Ø§Ù„ÙƒÙˆØ¨ÙˆÙ†" },
        { status: 400 }
      );
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return NextResponse.json(
        { status: "error", message: "ÙƒÙˆØ¯ Ø§Ù„ÙƒÙˆØ¨ÙˆÙ† ØºÙŠØ± ØµØ­ÙŠØ­" },
        { status: 404 }
      );
    }

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      return NextResponse.json(
        { status: "error", message: "Ù‡Ø°Ø§ Ø§Ù„ÙƒÙˆØ¨ÙˆÙ† Ù…Ù†ØªÙ‡ÙŠ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ© Ø£Ùˆ Ù„Ù… ÙŠØ¨Ø¯Ø£ Ø¨Ø¹Ø¯" },
        { status: 400 }
      );
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json(
        { status: "error", message: "ØªÙ… Ø§Ø³ØªÙ†ÙØ§Ø¯ Ø¹Ø¯Ø¯ Ù…Ø±Ø§Øª Ø§Ø³ØªØ®Ø¯Ø§Ù… Ù‡Ø°Ø§ Ø§Ù„ÙƒÙˆØ¨ÙˆÙ†" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "Ø§Ù„ÙƒÙˆØ¨ÙˆÙ† ØµØ§Ù„Ø­ Ù„Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù…",
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        value: coupon.value,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


