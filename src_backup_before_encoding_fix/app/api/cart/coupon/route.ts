// src/app/api/cart/coupon/route.ts
// POST /api/cart/coupon â†’ ÙŠØ­ÙØ¸ ÙƒÙˆØ¯ Ø§Ù„ÙƒÙˆØ¨ÙˆÙ† Ø¯Ø§Ø®Ù„ Ø³Ù„Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø¨Ø¹Ø¯ Ø§Ù„ØªØ£ÙƒØ¯ Ù…Ù† ØµÙ„Ø§Ø­ÙŠØªÙ‡
// DELETE /api/cart/coupon â†’ ÙŠØ²ÙŠÙ„ Ø§Ù„ÙƒÙˆØ¨ÙˆÙ† Ø§Ù„Ù…ÙØ·Ø¨Ù‘Ù‚ Ù…Ù† Ø§Ù„Ø³Ù„Ø©

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Cart from "@/models/Cart";
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
    if (now < coupon.startDate || now > coupon.endDate || coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json(
        { status: "error", message: "Ù‡Ø°Ø§ Ø§Ù„ÙƒÙˆØ¨ÙˆÙ† ØºÙŠØ± ØµØ§Ù„Ø­ Ù„Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø­Ø§Ù„ÙŠØ§Ù‹" },
        { status: 400 }
      );
    }

    const cart = await Cart.findOneAndUpdate(
      { userId: currentUser.userId },
      { couponCode: coupon.code },
      { new: true, upsert: true }
    ).populate("items.productId", "name price discountPrice images stock");

    return NextResponse.json({
      status: "success",
      message: "ØªÙ… ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„ÙƒÙˆØ¨ÙˆÙ† Ø¨Ù†Ø¬Ø§Ø­",
      cart,
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

export async function DELETE(req: NextRequest) {
  try {
    const currentUser = getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json(
        { status: "error", message: "ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„" },
        { status: 401 }
      );
    }

    await connectDB();
    const cart = await Cart.findOneAndUpdate(
      { userId: currentUser.userId },
      { $unset: { couponCode: "" } },
      { new: true }
    ).populate("items.productId", "name price discountPrice images stock");

    return NextResponse.json({ status: "success", message: "ØªÙ… Ø¥Ù„ØºØ§Ø¡ Ø§Ù„ÙƒÙˆØ¨ÙˆÙ†", cart, coupon: null });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


