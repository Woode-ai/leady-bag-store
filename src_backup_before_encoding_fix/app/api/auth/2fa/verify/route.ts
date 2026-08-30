// src/app/api/auth/2fa/verify/route.ts
// POST /api/auth/2fa/verify
// Ø¨Ø¹Ø¯ Ø£Ù† ÙŠÙ…Ø³Ø­ Ø§Ù„Ø£Ø¯Ù…Ù† Ø±Ù…Ø² QR Ù…Ù† /setupØŒ ÙŠÙØ¯Ø®Ù„ Ø§Ù„ÙƒÙˆØ¯ Ø§Ù„Ø¸Ø§Ù‡Ø± ÙÙŠ ØªØ·Ø¨ÙŠÙ‚Ù‡ Ù‡Ù†Ø§ Ù„Ù„ØªØ£ÙƒÙŠØ¯
// Ø¥Ø°Ø§ ÙƒØ§Ù† ØµØ­ÙŠØ­Ø§Ù‹ØŒ Ù†ÙÙØ¹Ù‘Ù„ twoFactorEnabled = true ÙØ¹Ù„ÙŠØ§Ù‹ (Ù…Ù† Ø§Ù„Ø¢Ù† ÙØµØ§Ø¹Ø¯Ø§Ù‹ØŒ Ø³ÙŠÙØ·Ù„Ø¨ Ø§Ù„ÙƒÙˆØ¯ Ø¹Ù†Ø¯ ÙƒÙ„ Ø¯Ø®ÙˆÙ„)

import { NextRequest, NextResponse } from "next/server";
import { authenticator } from "otplib";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { status: "error", message: "ØºÙŠØ± Ù…ØµØ±Ø­ Ù„Ùƒ" },
        { status: 403 }
      );
    }

    await connectDB();
    const { code } = await req.json();
    if (!code) {
      return NextResponse.json(
        { status: "error", message: "ÙŠØ¬Ø¨ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ù„ÙƒÙˆØ¯" },
        { status: 400 }
      );
    }

    const user = await User.findById(admin.userId).select("+twoFactorSecret");
    if (!user || !user.twoFactorSecret) {
      return NextResponse.json(
        { status: "error", message: "ÙŠØ¬Ø¨ Ø¥Ø¹Ø¯Ø§Ø¯ 2FA Ø£ÙˆÙ„Ø§Ù‹ Ø¹Ø¨Ø± /setup" },
        { status: 400 }
      );
    }

    const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!isValid) {
      return NextResponse.json(
        { status: "error", message: "Ø§Ù„ÙƒÙˆØ¯ ØºÙŠØ± ØµØ­ÙŠØ­ - ØªØ£ÙƒØ¯ Ù…Ù† Ø§Ù„ÙˆÙ‚Øª Ø§Ù„ØµØ­ÙŠØ­ Ø¹Ù„Ù‰ Ø¬Ù‡Ø§Ø²Ùƒ" },
        { status: 401 }
      );
    }

    user.twoFactorEnabled = true;
    await user.save();

    return NextResponse.json({
      status: "success",
      message: "ØªÙ… ØªÙØ¹ÙŠÙ„ Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø© Ø§Ù„Ø«Ù†Ø§Ø¦ÙŠØ© Ø¨Ù†Ø¬Ø§Ø­! Ø³ÙŠÙØ·Ù„Ø¨ Ù…Ù†Ùƒ Ø§Ù„ÙƒÙˆØ¯ ÙÙŠ ÙƒÙ„ Ù…Ø±Ø© ØªØ³Ø¬Ù‘Ù„ ÙÙŠÙ‡Ø§ Ø§Ù„Ø¯Ø®ÙˆÙ„",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


