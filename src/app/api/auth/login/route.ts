// src/app/api/auth/login/route.ts
// POST /api/auth/login
// يشمل: حماية متقدمة من محاولات التخمين، قفل الحساب، دعم تشفير لاراول ($2y$) والمصادقة الثنائية (2FA)

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { authenticator } from "otplib";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { signToken } from "@/lib/jwt";
import { loginSchema } from "@/lib/validation";
import { checkRateLimit, resetRateLimit, getClientIp } from "@/lib/rateLimit";
import { sanitizeInput } from "@/lib/sanitize";
import { setAuthCookie } from "@/lib/session";
import { comparePassword } from "@/lib/password";

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
        { status: "error", message: "بيانات غير صحيحة", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { email, password, twoFactorCode } = parsed.data;

    // 1. الحماية من التخمين المتكرر (Rate Limiting)
    const clientIp = getClientIp(req);
    const rateLimitKey = `login:${clientIp}:${email.toLowerCase().trim()}`;
    const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          status: "error",
          message: `محاولات كثيرة جداً. يرجى المحاولة مرة أخرى بعد ${Math.ceil(
            (rateLimit.retryAfterSeconds || 0) / 60
          )} دقيقة`,
        },
        { status: 429 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password +twoFactorSecret");

    if (!user) {
      return NextResponse.json(
        { status: "error", message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    // 2. التحقق من قفل الحساب
    if (user.lockUntil && user.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { status: "error", message: `الحساب مقفل مؤقتاً لحمايتك. حاول بعد ${minutesLeft} دقيقة` },
        { status: 423 }
      );
    }

    // 3. مقارنة كلمة المرور مع دعم كامل لتشفير لاراول $2y$ و $2x$ و bcryptjs
    const isPasswordCorrect = await comparePassword(password, user.password);
    if (!isPasswordCorrect) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save();

      return NextResponse.json(
        { status: "error", message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    // 4. التحقق من تأكيد البريد الإلكتروني
    if (!user.emailVerified) {
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
          message: "يجب تأكيد بريدك الإلكتروني أولاً. تم إرسال رمز تحقق جديد إلى بريدك",
          email: user.email,
        },
        { status: 403 }
      );
    }

    // 5. التحقق من المصادقة الثنائية (2FA) إن كانت مفعلة
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return NextResponse.json(
          { status: "2fa_required", message: "يجب إدخال رمز المصادقة الثنائية (2FA)" },
          { status: 200 }
        );
      }

      const isCodeValid = authenticator.verify({
        token: twoFactorCode,
        secret: user.twoFactorSecret as string,
      });

      if (!isCodeValid) {
        return NextResponse.json(
          { status: "error", message: "رمز المصادقة الثنائية غير صحيح أو منتهي الصلاحية" },
          { status: 401 }
        );
      }
    }

    // تصفير محاولات الدخول الفاشلة والـ Rate Limit
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
    resetRateLimit(rateLimitKey);

    const token = signToken({ userId: user._id.toString(), role: user.role });

    const response = NextResponse.json({
      status: "success",
      message: "تم تسجيل الدخول بنجاح",
      user: {
        id: user._id.toString(),
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
      {
        status: "error",
        message: "حدث خطأ في السيرفر",
        ...(process.env.NODE_ENV !== "production" && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
