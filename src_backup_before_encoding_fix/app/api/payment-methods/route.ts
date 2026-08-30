// src/app/api/payment-methods/route.ts
// GET  /api/payment-methods â†’ Ù‚Ø§Ø¦Ù…Ø© Ø·Ø±Ù‚ Ø§Ù„Ø¯ÙØ¹
//   - Ø¨Ø¯ÙˆÙ† ØªØ³Ø¬ÙŠÙ„ Ø¯Ø®ÙˆÙ„ ÙƒØ£Ø¯Ù…Ù†: ØªÙØ¹Ø§Ø¯ ÙÙ‚Ø· Ø§Ù„Ø·Ø±Ù‚ Ø§Ù„Ù…ÙØ¹Ù‘Ù„Ø© (isActive: true) - Ù‡Ø°Ø§ Ù…Ø§ ØªØ³ØªØ®Ø¯Ù…Ù‡ ØµÙØ­Ø© Ø§Ù„Ø¯ÙØ¹ Ù„Ù„Ø¹Ù…ÙŠÙ„
//   - Ù…Ø¹ ØªÙˆÙƒÙ† Ø£Ø¯Ù…Ù† ØµØ­ÙŠØ­: ØªÙØ¹Ø§Ø¯ ÙƒÙ„ Ø§Ù„Ø·Ø±Ù‚ (Ù…ÙØ¹Ù‘Ù„Ø© ÙˆØºÙŠØ± Ù…ÙØ¹Ù‘Ù„Ø©) - Ù„Ø¹Ø±Ø¶Ù‡Ø§ ÙÙŠ Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…
// POST /api/payment-methods â†’ Ø¥Ø¶Ø§ÙØ© Ø·Ø±ÙŠÙ‚Ø© Ø¯ÙØ¹ Ø¬Ø¯ÙŠØ¯Ø© (Ø£Ø¯Ù…Ù† ÙÙ‚Ø·)

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import PaymentMethod from "@/models/PaymentMethod";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { paymentMethodSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const currentUser = getCurrentUser(req);
    const isAdmin = currentUser?.role === "admin";

    const filter = isAdmin ? {} : { isActive: true };
    const paymentMethods = await PaymentMethod.find(filter).sort({ sortOrder: 1, createdAt: 1 });

    return NextResponse.json({ status: "success", paymentMethods });
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

    const parsed = paymentMethodSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { status: "error", message: "Ø¨ÙŠØ§Ù†Ø§Øª ØºÙŠØ± ØµØ­ÙŠØ­Ø©", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const paymentMethod = await PaymentMethod.create(parsed.data);

    return NextResponse.json(
      { status: "success", message: "ØªÙ… Ø¥Ø¶Ø§ÙØ© Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø¯ÙØ¹ Ø¨Ù†Ø¬Ø§Ø­", paymentMethod },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


