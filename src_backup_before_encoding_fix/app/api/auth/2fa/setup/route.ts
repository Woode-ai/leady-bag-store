// src/app/api/auth/2fa/setup/route.ts
// POST /api/auth/2fa/setup
// ÙŠÙØ³ØªØ¯Ø¹Ù‰ Ø¹Ù†Ø¯Ù…Ø§ ÙŠØ±ÙŠØ¯ Ø§Ù„Ø£Ø¯Ù…Ù† ØªÙØ¹ÙŠÙ„ 2FA Ù„Ø£ÙˆÙ„ Ù…Ø±Ø©
// ÙŠÙˆÙ„Ù‘Ø¯ "Ø³Ø±Ø§Ù‹" Ø¹Ø´ÙˆØ§Ø¦ÙŠØ§Ù‹ ÙˆØ±Ù…Ø² QR Ù„ÙŠÙ…Ø³Ø­Ù‡ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø¨ØªØ·Ø¨ÙŠÙ‚ Ù…Ø«Ù„ Google Authenticator
// Ù…Ù„Ø§Ø­Ø¸Ø©: Ù„Ø§ Ù†ÙÙØ¹Ù‘Ù„ 2FA ÙØ¹Ù„ÙŠØ§Ù‹ Ù‡Ù†Ø§ Ø¨Ø¹Ø¯ - ÙÙ‚Ø· Ù†ÙÙ†Ø´Ø¦ Ø§Ù„Ø£Ø¯Ø§Ø©ØŒ ÙˆØ§Ù„ØªÙØ¹ÙŠÙ„ Ø§Ù„ÙØ¹Ù„ÙŠ ÙŠØªÙ… ÙÙŠ /verify
// (Ù‡Ø°Ø§ ÙŠÙ…Ù†Ø¹ Ø£Ù† ÙŠÙÙ‚ÙÙŽÙ„ Ø§Ù„Ø£Ø¯Ù…Ù† Ø®Ø§Ø±Ø¬ Ø­Ø³Ø§Ø¨Ù‡ Ø¥Ù† Ø£Ø®Ø·Ø£ ÙÙŠ Ù…Ø³Ø­ Ø§Ù„Ø±Ù…Ø²)

import { NextRequest, NextResponse } from "next/server";
import { authenticator } from "otplib";
import QRCode from "qrcode";
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
    const user = await User.findById(admin.userId);
    if (!user) {
      return NextResponse.json({ status: "error", message: "Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯" }, { status: 404 });
    }

    // Ù†ÙˆÙ„Ù‘Ø¯ Ø³Ø±Ø§Ù‹ Ø¬Ø¯ÙŠØ¯Ø§Ù‹ ÙÙŠ ÙƒÙ„ Ù…Ø±Ø© ÙŠÙØ³ØªØ¯Ø¹Ù‰ ÙÙŠÙ‡Ø§ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯ (Ø­ØªÙ‰ Ù„Ùˆ Ø£Ø¹Ø§Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©)
    const secret = authenticator.generateSecret();
    user.twoFactorSecret = secret;
    await user.save();

    // Ù†Ø¨Ù†ÙŠ Ø±Ø§Ø¨Ø· otpauth:// Ø§Ù„Ù‚ÙŠØ§Ø³ÙŠ Ø§Ù„Ø°ÙŠ ØªÙÙ‡Ù…Ù‡ ÙƒÙ„ ØªØ·Ø¨ÙŠÙ‚Ø§Øª Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø© (Google AuthenticatorØŒ AuthyØŒ Ø¥Ù„Ø®)
    const otpAuthUrl = authenticator.keyuri(user.email, "leadybag Admin", secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    return NextResponse.json({
      status: "success",
      message: "Ø§Ù…Ø³Ø­ Ø±Ù…Ø² QR Ø¨ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø©ØŒ Ø«Ù… Ø£Ø¯Ø®Ù„ Ø§Ù„ÙƒÙˆØ¯ Ø§Ù„Ø¸Ø§Ù‡Ø± Ù„ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø­Ù…Ø§ÙŠØ©",
      qrCodeDataUrl, // ØµÙˆØ±Ø© base64 ÙŠÙ…ÙƒÙ† Ø¹Ø±Ø¶Ù‡Ø§ Ù…Ø¨Ø§Ø´Ø±Ø© ÙÙŠ <img src="..."/>
      secret, // Ù†Ø¹Ø±Ø¶Ù‡ Ø£ÙŠØ¶Ø§Ù‹ ÙƒÙ†ØµØŒ Ù„Ù…Ù† ÙŠÙØ¶Ù‘Ù„ Ø¥Ø¯Ø®Ø§Ù„Ù‡ ÙŠØ¯ÙˆÙŠØ§Ù‹ Ø¨Ø¯Ù„Ø§Ù‹ Ù…Ù† Ù…Ø³Ø­ QR
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


