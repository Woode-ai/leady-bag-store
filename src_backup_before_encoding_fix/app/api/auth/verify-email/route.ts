import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { signToken } from "@/lib/jwt";
import { checkRateLimit, resetRateLimit, getClientIp } from "@/lib/rateLimit";
import { setAuthCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { status: "error", message: "ÙŠØ±Ø¬Ù‰ ØªÙ‚Ø¯ÙŠÙ… Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ ÙˆØ±Ù…Ø² Ø§Ù„ØªØ­Ù‚Ù‚" },
        { status: 400 }
      );
    }

    // Ø­Ù…Ø§ÙŠØ© Ù…Ù† ØªØ®Ù…ÙŠÙ† Ø±Ù…Ø² Ø§Ù„Ù€ OTP (6 Ø£Ø±Ù‚Ø§Ù…) Ø¨Ù…Ø­Ø§ÙˆÙ„Ø§Øª Ù…ØªÙƒØ±Ø±Ø© ØªÙ„Ù‚Ø§Ø¦ÙŠØ©
    const clientIp = getClientIp(req);
    const rateLimitKey = `verify-email:${clientIp}:${String(email).toLowerCase().trim()}`;
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

    await connectDB();

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      emailVerificationCode: code.trim(),
      emailVerificationExpires: { $gt: new Date() },
    }).select("+emailVerificationCode +emailVerificationExpires");

    if (!user) {
      return NextResponse.json(
        {
          status: "error",
          message: "Ø±Ù…Ø² Ø§Ù„ØªØ­Ù‚Ù‚ ØºÙŠØ± ØµØ­ÙŠØ­ Ø£Ùˆ Ø§Ù†ØªÙ‡Øª ØµÙ„Ø§Ø­ÙŠØªÙ‡ (ØµØ§Ù„Ø­ Ù„Ù€ 15 Ø¯Ù‚ÙŠÙ‚Ø©)",
        },
        { status: 400 }
      );
    }

    user.emailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    user.emailVerificationToken = undefined;
    await user.save();

    resetRateLimit(rateLimitKey);

    const token = signToken({ userId: user._id.toString(), role: user.role });

    const response = NextResponse.json({
      status: "success",
      message: "ØªÙ… ØªÙØ¹ÙŠÙ„ Ø¨Ø±ÙŠØ¯Ùƒ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ ÙˆØ­Ø³Ø§Ø¨Ùƒ Ø¨Ù†Ø¬Ø§Ø­!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: true,
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { status: "error", message: "Ø±Ø§Ø¨Ø· Ø§Ù„ØªÙØ¹ÙŠÙ„ ØºÙŠØ± ØµØ­ÙŠØ­" },
        { status: 400 }
      );
    }

    await connectDB();

    // Ù†Ø¨Ø­Ø« Ø¹Ù† Ù…Ø³ØªØ®Ø¯Ù… ÙŠÙ…Ù„Ùƒ Ù‡Ø°Ø§ Ø§Ù„Ø±Ù…Ø² Ø¨Ø§Ù„Ø¶Ø¨Ø·ØŒ ÙˆØ£Ù† ØµÙ„Ø§Ø­ÙŠØªÙ‡ Ù„Ù… ØªÙ†ØªÙ‡Ù Ø¨Ø¹Ø¯
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      return NextResponse.json(
        {
          status: "error",
          message: "Ø±Ø§Ø¨Ø· Ø§Ù„ØªÙØ¹ÙŠÙ„ ØºÙŠØ± ØµØ­ÙŠØ­ Ø£Ùˆ Ù…Ù†ØªÙ‡ÙŠ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ© - Ø§Ø·Ù„Ø¨ Ø±Ù…Ø²Ø§Ù‹ Ø¬Ø¯ÙŠØ¯Ø§Ù‹",
        },
        { status: 400 }
      );
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return NextResponse.json({
      status: "success",
      message: "ØªÙ… ØªÙØ¹ÙŠÙ„ Ø¨Ø±ÙŠØ¯Ùƒ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ø¨Ù†Ø¬Ø§Ø­",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


