// src/app/api/auth/resend-verification/route.ts
// POST /api/auth/resend-verification
// ÙŠÙØ³ØªØ®Ø¯Ù… Ø¥Ø°Ø§ Ù„Ù… ÙŠØ³ØªÙ„Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø£ÙˆÙ„ØŒ Ø£Ùˆ Ø§Ù†ØªÙ‡Øª ØµÙ„Ø§Ø­ÙŠØ© Ø§Ù„Ø±Ø§Ø¨Ø· Ø§Ù„Ù‚Ø¯ÙŠÙ…
// ÙŠØªØ·Ù„Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ (Ù†Ø¹Ø±Ù "Ù…Ù†" Ù†ÙØ±Ø³Ù„ Ù„Ù‡ Ø§Ù„Ø±Ù…Ø² Ø§Ù„Ø¬Ø¯ÙŠØ¯ Ù…Ù† Ø§Ù„ØªÙˆÙƒÙ† Ù†ÙØ³Ù‡)

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/mailer";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const currentUser = getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json(
        { status: "error", message: "ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„" },
        { status: 401 }
      );
    }

    // Ù†Ù…Ù†Ø¹ Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ø¥Ø±Ø³Ø§Ù„ Ø£ÙƒØ«Ø± Ù…Ù† Ø¹Ø¯Ø© Ù…Ø±Ø§Øª Ù…ØªØªØ§Ù„ÙŠØ© - Ù„Ø­Ù…Ø§ÙŠØ© Ø­ØµØ© SMTP Ù…Ù† Ø§Ù„Ø§Ø³ØªÙ†ÙØ§Ø¯ ÙˆÙ…Ù†Ø¹ Ø¥Ø²Ø¹Ø§Ø¬ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø§Ù„Ø¢Ø®Ø±
    const rateLimit = checkRateLimit(`resend-verification:${currentUser.userId}`);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          status: "error",
          message: `Ù…Ø­Ø§ÙˆÙ„Ø§Øª ÙƒØ«ÙŠØ±Ø©. Ø­Ø§ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰ Ø¨Ø¹Ø¯ ${Math.ceil((rateLimit.retryAfterSeconds || 0) / 60)} Ø¯Ù‚ÙŠÙ‚Ø©`,
        },
        { status: 429 }
      );
    }

    await connectDB();
    const user = await User.findById(currentUser.userId);

    if (!user) {
      return NextResponse.json({ status: "error", message: "Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        status: "success",
        message: "Ø¨Ø±ÙŠØ¯Ùƒ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ù…ÙÙØ¹ÙŽÙ‘Ù„ Ø¨Ø§Ù„ÙØ¹Ù„",
        alreadyVerified: true,
      });
    }

    // Ù†ÙˆÙ„Ù‘Ø¯ Ø±Ù…Ø²Ø§Ù‹ Ø¬Ø¯ÙŠØ¯Ø§Ù‹ ÙÙŠ ÙƒÙ„ Ù…Ø±Ø© (Ù†ÙØ¨Ø·Ù„ Ø£ÙŠ Ø±Ø§Ø¨Ø· Ù‚Ø¯ÙŠÙ… Ø£ÙØ±Ø³Ù„ Ù…Ù† Ù‚Ø¨Ù„ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹)
    const verificationCode = crypto.randomInt(100000, 1000000).toString();
    const emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

    const { sendVerificationCodeEmail } = await import("@/lib/mailer");
    await sendVerificationCodeEmail(user.email, user.name, verificationCode);

    return NextResponse.json({
      status: "success",
      message: "ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø±Ù…Ø² ØªØ­Ù‚Ù‚ Ø¬Ø¯ÙŠØ¯ Ø¥Ù„Ù‰ Ø¨Ø±ÙŠØ¯Ùƒ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


