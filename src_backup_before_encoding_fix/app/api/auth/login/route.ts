// src/app/api/auth/login/route.ts
// POST /api/auth/login
// Ø§Ù„Ø¢Ù† ÙŠØ´Ù…Ù„: Ø­Ù…Ø§ÙŠØ© Ù…Ù† Ù…Ø­Ø§ÙˆÙ„Ø§Øª Ø§Ù„ØªØ®Ù…ÙŠÙ† Ø§Ù„Ù…ØªÙƒØ±Ø±ØŒ Ù‚ÙÙ„ Ø§Ù„Ø­Ø³Ø§Ø¨ Ø¨Ø¹Ø¯ 5 Ù…Ø­Ø§ÙˆÙ„Ø§Øª ÙØ§Ø´Ù„Ø©ØŒ
// ÙˆØ¯Ø¹Ù… Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø© Ø§Ù„Ø«Ù†Ø§Ø¦ÙŠØ© (2FA) Ø¥Ù† ÙƒØ§Ù†Øª Ù…ÙÙØ¹Ù‘Ù„Ø© Ø¹Ù„Ù‰ Ø§Ù„Ø­Ø³Ø§Ø¨ (Ø¹Ø§Ø¯Ø© Ø­Ø³Ø§Ø¨Ø§Øª Ø§Ù„Ø£Ø¯Ù…Ù†)

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { signToken } from "@/lib/jwt";
import { loginSchema } from "@/lib/validation";
import { checkRateLimit, resetRateLimit, getClientIp } from "@/lib/rateLimit";
import { sanitizeInput } from "@/lib/sanitize";
import { setAuthCookie } from "@/lib/session";

const loginWith2FASchema = loginSchema.extend({
  twoFactorCode: z.string().regex(/^\d{6}$/).optional(),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const rawBody = await req.json();
    const body = sanitizeInput(rawBody);

    const parsed = loginWith2FASchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { status: "error", message: "Ø¨ÙŠØ§Ù†Ø§Øª ØºÙŠØ± ØµØ­ÙŠØ­Ø©", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { email, password, twoFactorCode } = parsed.data;

    // 1. Ø§Ù„Ø­Ù…Ø§ÙŠØ© Ù…Ù† Ø§Ù„ØªØ®Ù…ÙŠÙ† Ø§Ù„Ù…ØªÙƒØ±Ø± - Ù†Ø­Ø³Ø¨Ù‡Ø§ Ø­Ø³Ø¨ (IP + Ø§Ù„Ø¨Ø±ÙŠØ¯) Ù…Ø¹Ø§Ù‹
    const clientIp = getClientIp(req);
    const rateLimitKey = `login:${clientIp}:${email}`;
    const rateLimit = checkRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          status: "error",
          message: `Ù…Ø­Ø§ÙˆÙ„Ø§Øª ÙƒØ«ÙŠØ±Ø© Ø¬Ø¯Ø§Ù‹. Ø­Ø§ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰ Ø¨Ø¹Ø¯ ${Math.ceil(
            (rateLimit.retryAfterSeconds || 0) / 60
          )} Ø¯Ù‚ÙŠÙ‚Ø©`,
        },
        { status: 429 }
      );
    }

    // Ù†Ø·Ù„Ø¨ ØµØ±Ø§Ø­Ø© twoFactorSecret Ù„Ø£Ù† select: false ÙÙŠ Ø§Ù„Ù†Ù…ÙˆØ°Ø¬ ÙŠØ®ÙÙŠÙ‡ Ø§ÙØªØ±Ø§Ø¶ÙŠØ§Ù‹
    const user = await User.findOne({ email }).select("+twoFactorSecret");

    if (!user) {
      return NextResponse.json(
        { status: "error", message: "Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ø£Ùˆ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ØºÙŠØ± ØµØ­ÙŠØ­Ø©" },
        { status: 401 }
      );
    }

    // 2. Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ù‚ÙÙ„ Ø§Ù„Ø­Ø³Ø§Ø¨ (Ø¨Ø³Ø¨Ø¨ Ù…Ø­Ø§ÙˆÙ„Ø§Øª ÙØ§Ø´Ù„Ø© Ø³Ø§Ø¨Ù‚Ø© ÙƒØ«ÙŠØ±Ø©)
    if (user.lockUntil && user.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { status: "error", message: `Ø§Ù„Ø­Ø³Ø§Ø¨ Ù…Ù‚ÙÙ„ Ù…Ø¤Ù‚ØªØ§Ù‹. Ø­Ø§ÙˆÙ„ Ø¨Ø¹Ø¯ ${minutesLeft} Ø¯Ù‚ÙŠÙ‚Ø©` },
        { status: 423 }
      );
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save();

      return NextResponse.json(
        { status: "error", message: "Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ø£Ùˆ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ØºÙŠØ± ØµØ­ÙŠØ­Ø©" },
        { status: 401 }
      );
    }

    // 2.5. Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ - Ù„Ø§ ÙŠØ³Ù…Ø­ Ø¨Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¥Ø°Ø§ Ù„Ù… ÙŠØªÙ… ØªÙØ¹ÙŠÙ„Ù‡
    if (!user.emailVerified) {
      // Ù†ÙˆÙ„Ù‘Ø¯ ÙƒÙˆØ¯ ØªØ­Ù‚Ù‚ Ø¬Ø¯ÙŠØ¯ ÙˆÙ†Ø±Ø³Ù„Ù‡ Ù„Ù‡ Ù„ØªØ³Ù‡ÙŠÙ„ Ø§Ù„ØªÙØ¹ÙŠÙ„ ÙÙˆØ±Ø§Ù‹
      const verificationCode = crypto.randomInt(100000, 1000000).toString();
      user.emailVerificationCode = verificationCode;
      user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();

      try {
        const { sendVerificationCodeEmail } = await import("@/lib/mailer");
        await sendVerificationCodeEmail(user.email, user.name, verificationCode);
      } catch (err) {
        console.error("Failed to send OTP:", err);
      }

      return NextResponse.json(
        {
          status: "needs_verification",
          message: "ÙŠØ¬Ø¨ ØªØ£ÙƒÙŠØ¯ Ø¨Ø±ÙŠØ¯Ùƒ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ø£ÙˆÙ„Ø§Ù‹. ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø±Ù…Ø² ØªØ­Ù‚Ù‚ Ø¬Ø¯ÙŠØ¯ Ø¥Ù„Ù‰ Ø¨Ø±ÙŠØ¯Ùƒ",
          email: user.email,
        },
        { status: 403 }
      );
    }

    // 3. Ø¥Ø°Ø§ ÙƒØ§Ù† Ø§Ù„Ø­Ø³Ø§Ø¨ Ù…ÙÙØ¹ÙŽÙ‘Ù„Ø§Ù‹ Ø¹Ù„ÙŠÙ‡ 2FA (Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø© Ø§Ù„Ø«Ù†Ø§Ø¦ÙŠØ©)
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return NextResponse.json(
          { status: "2fa_required", message: "ÙŠØ¬Ø¨ Ø¥Ø¯Ø®Ø§Ù„ ÙƒÙˆØ¯ Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø© Ø§Ù„Ø«Ù†Ø§Ø¦ÙŠØ©" },
          { status: 200 }
        );
      }

      const isCodeValid = authenticator.verify({
        token: twoFactorCode,
        secret: user.twoFactorSecret as string,
      });

      if (!isCodeValid) {
        return NextResponse.json(
          { status: "error", message: "ÙƒÙˆØ¯ Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø© Ø§Ù„Ø«Ù†Ø§Ø¦ÙŠØ© ØºÙŠØ± ØµØ­ÙŠØ­" },
          { status: 401 }
        );
      }
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
    resetRateLimit(rateLimitKey);

    const token = signToken({ userId: user._id.toString(), role: user.role });

    const response = NextResponse.json({
      status: "success",
      message: "ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¨Ù†Ø¬Ø§Ø­",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        loyaltyPoints: user.loyaltyPoints || 0,
      },
    });

    setAuthCookie(response, token);
    return response;
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


