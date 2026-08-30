// src/app/api/auth/register/route.ts
// POST /api/auth/register
// ÙŠÙ†Ø´Ø¦ Ø­Ø³Ø§Ø¨ Ù…Ø³ØªØ®Ø¯Ù… Ø¬Ø¯ÙŠØ¯ (Ø¹Ù…ÙŠÙ„). ÙŠØ´ÙÙ‘Ø± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ù‚Ø¨Ù„ Ø­ÙØ¸Ù‡Ø§ Ø£Ø¨Ø¯Ø§Ù‹ Ù„Ø§ Ù†Ø­ÙØ¸Ù‡Ø§ ÙƒÙ†Øµ Ø¹Ø§Ø¯ÙŠ

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { signToken } from "@/lib/jwt";
import { registerSchema } from "@/lib/validation";
import { sanitizeInput } from "@/lib/sanitize";
import { sendVerificationEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const rawBody = await req.json();
    // Ù†Ø¸Ù‘Ù Ø§Ù„Ù…Ø¯Ø®Ù„Ø§Øª Ø£ÙˆÙ„Ø§Ù‹ (Ù†Ø­Ø°Ù Ø£ÙŠ Ù…ÙØ§ØªÙŠØ­ $ Ø£Ùˆ ØªØ­ØªÙˆÙŠ Ù†Ù‚Ø·Ø©) Ù‚Ø¨Ù„ Ø­ØªÙ‰ Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„ØµØ­Ø©
    // Ø·Ø¨Ù‚Ø© Ø­Ù…Ø§ÙŠØ© Ø¥Ø¶Ø§ÙÙŠØ© ÙÙˆÙ‚ Ø§Ù„ØªØ­Ù‚Ù‚ Ø¨Ù€ Zod Ø¶Ø¯ Ù…Ø­Ø§ÙˆÙ„Ø§Øª Ø­Ù‚Ù† NoSQL
    const body = sanitizeInput(rawBody);

    // 1. Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† ØµØ­Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…ÙØ±Ø³Ù„Ø©
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { status: "error", message: "Ø¨ÙŠØ§Ù†Ø§Øª ØºÙŠØ± ØµØ­ÙŠØ­Ø©", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { name, email, password, phone, address } = parsed.data;

    // 2. Ø§Ù„ØªØ£ÙƒØ¯ Ø£Ù† Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ ØºÙŠØ± Ù…Ø³ØªØ®Ø¯Ù… Ù…Ù† Ù‚Ø¨Ù„
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { status: "error", message: "Ù‡Ø°Ø§ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ù…Ø³ØªØ®Ø¯Ù… Ø¨Ø§Ù„ÙØ¹Ù„" },
        { status: 409 }
      );
    }

    // 3. ØªØ´ÙÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± (bcrypt) - Ø±Ù‚Ù… 10 Ù‡Ùˆ "Ù‚ÙˆØ©" Ø§Ù„ØªØ´ÙÙŠØ±ØŒ Ø§Ù„Ù‚ÙŠØ§Ø³ÙŠ ÙˆØ§Ù„Ø¢Ù…Ù†
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3.5. ØªÙˆÙ„ÙŠØ¯ Ø±Ù…Ø² ØªØ­Ù‚Ù‚ Ø±Ù‚Ù…ÙŠ Ù…ÙƒÙˆÙ† Ù…Ù† 6 Ø£Ø±Ù‚Ø§Ù… (OTP) ÙˆØµÙ„Ø§Ø­ÙŠØªÙ‡ 15 Ø¯Ù‚ÙŠÙ‚Ø©
    const verificationCode = crypto.randomInt(100000, 1000000).toString();
    const emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");

    // 4. Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ÙÙŠ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      role: "customer", // ÙƒÙ„ Ø­Ø³Ø§Ø¨ Ø¬Ø¯ÙŠØ¯ ÙŠÙÙ†Ø´Ø£ ÙƒØ¹Ù…ÙŠÙ„ Ø¹Ø§Ø¯ÙŠØŒ Ø§Ù„Ø£Ø¯Ù…Ù† ÙŠÙÙ†Ø´Ø£ ÙŠØ¯ÙˆÙŠØ§Ù‹ ÙÙ‚Ø·
      emailVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationToken,
      emailVerificationExpires,
      loyaltyPoints: 50, // Ù…ÙƒØ§ÙØ£Ø© ØªØ³Ø¬ÙŠÙ„ ØªØ±Ø­ÙŠØ¨ÙŠØ© 50 Ù†Ù‚Ø·Ø©
    });

    // 4.5. Ø¥Ø±Ø³Ø§Ù„ Ø±Ù…Ø² Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø© Ù„Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ
    try {
      const { sendVerificationCodeEmail } = await import("@/lib/mailer");
      await sendVerificationCodeEmail(user.email, user.name, verificationCode);
    } catch (emailError) {
      console.error("âš ï¸ ØªØ¹Ø°Ù‘Ø± Ø¥Ø±Ø³Ø§Ù„ Ø±Ù…Ø² Ø§Ù„ØªÙØ¹ÙŠÙ„ØŒ Ù„ÙƒÙ† Ø§Ù„Ø­Ø³Ø§Ø¨ Ø£ÙÙ†Ø´Ø¦ Ø¨Ù†Ø¬Ø§Ø­:", emailError);
    }

    return NextResponse.json(
      {
        status: "success",
        message: "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨ Ø¨Ù†Ø¬Ø§Ø­! ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø±Ù…Ø² Ø§Ù„ØªØ­Ù‚Ù‚ Ø§Ù„Ù…ÙØ±Ø³Ù„ Ø¥Ù„Ù‰ Ø¨Ø±ÙŠØ¯Ùƒ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ",
        email: user.email,
        needsVerification: true,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


