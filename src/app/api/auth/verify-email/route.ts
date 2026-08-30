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
        { status: "error", message: "يرجى تقديم البريد الإلكتروني ورمز التحقق" },
        { status: 400 }
      );
    }

    // حماية من تخمين رمز الـ OTP (6 أرقام) بمحاولات متكررة تلقائية
    const clientIp = getClientIp(req);
    const rateLimitKey = `verify-email:${clientIp}:${String(email).toLowerCase().trim()}`;
    const rateLimit = checkRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          status: "error",
          message: `محاولات كثيرة جداً. حاول مرة أخرى بعد ${Math.ceil(
            (rateLimit.retryAfterSeconds || 0) / 60
          )} دقيقة`,
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
          message: "رمز التحقق غير صحيح أو انتهت صلاحيته (صالح لـ 15 دقيقة)",
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
      message: "تم تفعيل بريدك الإلكتروني وحسابك بنجاح!",
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
      { status: "error", message: "حدث خطأ في السيرفر", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
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
        { status: "error", message: "رابط التفعيل غير صحيح" },
        { status: 400 }
      );
    }

    await connectDB();

    // نبحث عن مستخدم يملك هذا الرمز بالضبط، وأن صلاحيته لم تنتهِ بعد
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      return NextResponse.json(
        {
          status: "error",
          message: "رابط التفعيل غير صحيح أو منتهي الصلاحية - اطلب رمزاً جديداً",
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
      message: "تم تفعيل بريدك الإلكتروني بنجاح",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "حدث خطأ في السيرفر", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


