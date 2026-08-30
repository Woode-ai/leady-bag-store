// src/app/api/coupons/route.ts
// GET  /api/coupons  â†’ Ø¹Ø±Ø¶ ÙƒÙ„ Ø§Ù„ÙƒÙˆØ¨ÙˆÙ†Ø§Øª (Ø£Ø¯Ù…Ù† ÙÙ‚Ø· - ÙŠÙØ³ØªØ®Ø¯Ù… ÙÙŠ Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…)
// POST /api/coupons  â†’ Ø¥Ù†Ø´Ø§Ø¡ ÙƒÙˆØ¨ÙˆÙ† Ø¬Ø¯ÙŠØ¯ (Ø£Ø¯Ù…Ù† ÙÙ‚Ø·)

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Coupon from "@/models/Coupon";
import { requireAdmin } from "@/lib/auth";
import { couponSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { status: "error", message: "ØºÙŠØ± Ù…ØµØ±Ø­ Ù„Ùƒ - Ù‡Ø°Ø§ Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡ Ù„Ù„Ø£Ø¯Ù…Ù† ÙÙ‚Ø·" },
        { status: 403 }
      );
    }

    await connectDB();
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return NextResponse.json({ status: "success", coupons });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { status: "error", message: "ØºÙŠØ± Ù…ØµØ±Ø­ Ù„Ùƒ - Ù‡Ø°Ø§ Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡ Ù„Ù„Ø£Ø¯Ù…Ù† ÙÙ‚Ø·" },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await req.json();

    const parsed = couponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { status: "error", message: "Ø¨ÙŠØ§Ù†Ø§Øª ØºÙŠØ± ØµØ­ÙŠØ­Ø©", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await Coupon.findOne({ code: parsed.data.code.toUpperCase() });
    if (existing) {
      return NextResponse.json(
        { status: "error", message: "ÙŠÙˆØ¬Ø¯ ÙƒÙˆØ¨ÙˆÙ† Ø¢Ø®Ø± Ø¨Ù†ÙØ³ Ø§Ù„ÙƒÙˆØ¯" },
        { status: 409 }
      );
    }

    const coupon = await Coupon.create({
      ...parsed.data,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
    });

    return NextResponse.json(
      { status: "success", message: "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„ÙƒÙˆØ¨ÙˆÙ† Ø¨Ù†Ø¬Ø§Ø­", coupon },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


