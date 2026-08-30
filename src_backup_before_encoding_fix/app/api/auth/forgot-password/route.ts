// src/app/api/auth/forgot-password/route.ts
// POST /api/auth/forgot-password
// ÙŠÙˆÙ„Ù‘Ø¯ Ø±Ù…Ø² OTP Ù„Ø¥Ø¹Ø§Ø¯Ø© ØªØ¹ÙŠÙŠÙ† ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±ØŒ ÙŠØ­ÙØ¸Ù‡ ÙÙŠ Ø­Ø³Ø§Ø¨ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… (Ù…Ø´ÙÙ‘Ø±Ø§Ù‹ Ø¨ØµÙ„Ø§Ø­ÙŠØ© 15 Ø¯Ù‚ÙŠÙ‚Ø©)
// Ø«Ù… ÙŠØ±Ø³Ù„Ù‡ Ø¹Ø¨Ø± Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ. Ù„Ø§ Ù†ÙƒØ´Ù Ø£Ø¨Ø¯Ø§Ù‹ Ù‡Ù„ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ù…ÙØ¯Ø®Ù„ Ù…Ø³Ø¬Ù‘Ù„ Ù„Ø¯ÙŠÙ†Ø§ Ø£Ù… Ù„Ø§
// (Ù†ÙØ³ Ø§Ù„Ø±Ø³Ø§Ù„Ø© ÙÙŠ Ø§Ù„Ø­Ø§Ù„ØªÙŠÙ†) Ø­ØªÙ‰ Ù„Ø§ ÙŠØ³ØªØ·ÙŠØ¹ Ø£ÙŠ Ø´Ø®Øµ Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ù‚Ø§Ø¦Ù…Ø© Ø¹Ù…Ù„Ø§Ø¦Ù†Ø§ Ø¨Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const GENERIC_MESSAGE =
  "Ø¥Ø°Ø§ ÙƒØ§Ù† Ù‡Ø°Ø§ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ù…Ø³Ø¬Ù„Ø§Ù‹ Ù„Ø¯ÙŠÙ†Ø§ØŒ ÙÙ‚Ø¯ Ø£ÙØ±Ø³Ù„ Ø¥Ù„ÙŠÙ‡ Ø±Ù…Ø² Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„ØªØ¹ÙŠÙŠÙ†";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ù…Ø·Ù„ÙˆØ¨" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Ø­Ù…Ø§ÙŠØ© Ù…Ù† Ø¥Ø³Ø§Ø¡Ø© Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… (Ø¥ØºØ±Ø§Ù‚ Ø¨Ø±ÙŠØ¯ Ø´Ø®Øµ Ø¢Ø®Ø± Ø¨Ø±Ø³Ø§Ø¦Ù„ OTP Ø£Ùˆ Ù…Ø­Ø§ÙˆÙ„Ø© Ø§Ø³ØªÙƒØ´Ø§Ù Ø§Ù„Ø­Ø³Ø§Ø¨Ø§Øª Ø§Ù„Ù…Ø³Ø¬Ù„Ø©)
    // Ù†Ø­Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø§Øª Ø­Ø³Ø¨ (IP + Ø§Ù„Ø¨Ø±ÙŠØ¯) Ù…Ø¹Ø§Ù‹ØŒ Ø¨Ù†ÙØ³ Ø¢Ù„ÙŠØ© Ø§Ù„Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…Ø© ÙÙŠ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`forgot-password:${clientIp}:${normalizedEmail}`);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Ù…Ø­Ø§ÙˆÙ„Ø§Øª ÙƒØ«ÙŠØ±Ø© Ø¬Ø¯Ø§Ù‹. Ø­Ø§ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰ Ø¨Ø¹Ø¯ ${Math.ceil(
            (rateLimit.retryAfterSeconds || 0) / 60
          )} Ø¯Ù‚ÙŠÙ‚Ø©`,
        },
        { status: 429 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email: normalizedEmail });

    // Ù„Ø§ Ù†ÙƒØ´Ù Ø¹Ø¯Ù… ÙˆØ¬ÙˆØ¯ Ø§Ù„Ø­Ø³Ø§Ø¨ - Ù†Ø¹ÙŠØ¯ Ù†ÙØ³ Ø§Ù„Ø±Ø³Ø§Ù„Ø© Ø¯Ø§Ø¦Ù…Ø§Ù‹ (ÙŠÙ…Ù†Ø¹ ØªØ¹Ø¯Ø§Ø¯/Ø§ÙƒØªØ´Ø§Ù Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ù„Ù„Ø¹Ù…Ù„Ø§Ø¡)
    if (user) {
      const otp = crypto.randomInt(100000, 1000000).toString();
      user.passwordResetCode = otp;
      user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // ØµØ§Ù„Ø­ 15 Ø¯Ù‚ÙŠÙ‚Ø©
      await user.save();

      try {
        await sendPasswordResetEmail(user.email, user.name, otp);
      } catch (emailError) {
        console.error("âš ï¸ ØªØ¹Ø°Ù‘Ø± Ø¥Ø±Ø³Ø§Ù„ Ø¨Ø±ÙŠØ¯ Ø§Ø³ØªØ¹Ø§Ø¯Ø© ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±:", emailError);
      }
    }

    return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
  } catch (error: unknown) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      { success: false, message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø®Ø§Ø¯Ù…" },
      { status: 500 }
    );
  }
}


