// src/app/api/auth/reset-password/route.ts
// POST /api/auth/reset-password
// يتحقق من رمز OTP ثم يحدّث كلمة المرور بأمان

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { checkRateLimit, resetRateLimit, getClientIp } from "@/lib/rateLimit";
import { sanitizeInput } from "@/lib/sanitize";
import { hashPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const { email, code, newPassword } = sanitizeInput(rawBody);

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { success: false, message: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // حماية من تخمين رمز OTP
    const clientIp = getClientIp(request);
    const rateLimitKey = `reset-password:${clientIp}:${normalizedEmail}`;
    const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `محاولات كثيرة جداً. حاول مرة أخرى بعد ${Math.ceil(
            (rateLimit.retryAfterSeconds || 0) / 60
          )} دقيقة`,
        },
        { status: 429 }
      );
    }

    await connectDB();

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
        { success: false, message: "رمز التحقق غير صحيح أو انتهت صلاحيته" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(newPassword);

    user.password = hashedPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    resetRateLimit(rateLimitKey);

    return NextResponse.json(
      { success: true, message: "تم تحديث كلمة المرور بنجاح" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
