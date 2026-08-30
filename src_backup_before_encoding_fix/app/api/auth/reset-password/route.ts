// src/app/api/auth/reset-password/route.ts
// POST /api/auth/reset-password
// ÙŠØªØ­Ù‚Ù‚ Ù…Ù† Ø±Ù…Ø² OTP Ø§Ù„Ø°ÙŠ Ø£Ø±Ø³Ù„Ù†Ø§Ù‡ Ø¹Ø¨Ø± /forgot-passwordØŒ Ø«Ù… ÙŠØ­Ø¯Ù‘Ø« ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø¥Ø°Ø§ ÙƒØ§Ù† ØµØ­ÙŠØ­Ø§Ù‹ ÙˆØºÙŠØ± Ù…Ù†ØªÙ‡ÙŠ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ©

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { checkRateLimit, resetRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø­Ù‚ÙˆÙ„ Ù…Ø·Ù„ÙˆØ¨Ø©" },
        { status: 400 }
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† 6 Ø£Ø­Ø±Ù Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Ø­Ù…Ø§ÙŠØ© Ù…Ù† ØªØ®Ù…ÙŠÙ† Ø±Ù…Ø² OTP (6 Ø£Ø±Ù‚Ø§Ù… = Ù…Ù„ÙŠÙˆÙ† Ø§Ø­ØªÙ…Ø§Ù„) Ø¹Ø¨Ø± ØªØ­Ø¯ÙŠØ¯ Ø¹Ø¯Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø§Øª Ø§Ù„Ù…Ø³Ù…ÙˆØ­Ø©
    // Ø¨Ø¯ÙˆÙ† Ù‡Ø°Ø§ØŒ ÙŠØ³ØªØ·ÙŠØ¹ Ø£ÙŠ Ø´Ø®Øµ ÙƒØªØ§Ø¨Ø© Ø³ÙƒØ±Ø¨Øª ÙŠØ¬Ø±Ù‘Ø¨ ÙƒÙ„ Ø§Ù„Ø£Ø±Ù‚Ø§Ù… Ø®Ù„Ø§Ù„ Ø¯Ù‚Ø§Ø¦Ù‚ ÙˆÙŠØ³ØªÙˆÙ„ÙŠ Ø¹Ù„Ù‰ Ø£ÙŠ Ø­Ø³Ø§Ø¨
    const clientIp = getClientIp(request);
    const rateLimitKey = `reset-password:${clientIp}:${normalizedEmail}`;
    const rateLimit = checkRateLimit(rateLimitKey);
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

    // Ù†Ø·Ù„Ø¨ ØµØ±Ø§Ø­Ø© passwordResetCode/passwordResetExpires Ù„Ø£Ù† select: false ÙÙŠ Ø§Ù„Ù†Ù…ÙˆØ°Ø¬ ÙŠØ®ÙÙŠÙ‡Ù…Ø§ Ø§ÙØªØ±Ø§Ø¶ÙŠØ§Ù‹
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+passwordResetCode +passwordResetExpires"
    );

    if (
      !user ||
      !user.passwordResetCode ||
      user.passwordResetCode !== String(code).trim() ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date()
    ) {
      return NextResponse.json(
        { success: false, message: "Ø±Ù…Ø² Ø§Ù„ØªØ­Ù‚Ù‚ ØºÙŠØ± ØµØ­ÙŠØ­ Ø£Ùˆ Ø§Ù†ØªÙ‡Øª ØµÙ„Ø§Ø­ÙŠØªÙ‡" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    // Ù†ØµÙÙ‘Ø± Ø£ÙŠ Ù‚ÙÙ„/Ù…Ø­Ø§ÙˆÙ„Ø§Øª Ø¯Ø®ÙˆÙ„ ÙØ§Ø´Ù„Ø© Ø³Ø§Ø¨Ù‚Ø© Ø¨Ù…Ø§ Ø£Ù† Ø§Ù„Ø¹Ù…ÙŠÙ„ Ø£Ø«Ø¨Øª Ù…Ù„ÙƒÙŠØªÙ‡ Ù„Ù„Ø­Ø³Ø§Ø¨ Ø¹Ø¨Ø± Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    resetRateLimit(rateLimitKey);

    return NextResponse.json(
      { success: true, message: "ØªÙ… ØªØ­Ø¯ÙŠØ« ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø¨Ù†Ø¬Ø§Ø­" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      { success: false, message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø®Ø§Ø¯Ù…" },
      { status: 500 }
    );
  }
}


