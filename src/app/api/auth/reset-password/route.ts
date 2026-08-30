// src/app/api/auth/reset-password/route.ts
// POST /api/auth/reset-password
// يتحقق من رمز OTP الذي أرسلناه عبر /forgot-password، ثم يحدّث كلمة المرور إذا كان صحيحاً وغير منتهي الصلاحية

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

    // حماية من تخمين رمز OTP (6 أرقام = مليون احتمال) عبر تحديد عدد المحاولات المسموحة
    // بدون هذا، يستطيع أي شخص كتابة سكربت يجرّب كل الأرقام خلال دقائق ويستولي على أي حساب
    const clientIp = getClientIp(request);
    const rateLimitKey = `reset-password:${clientIp}:${normalizedEmail}`;
    const rateLimit = checkRateLimit(rateLimitKey);
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

    // نطلب صراحة passwordResetCode/passwordResetExpires لأن select: false في النموذج يخفيهما افتراضياً
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

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    // نصفّر أي قفل/محاولات دخول فاشلة سابقة بما أن العميل أثبت ملكيته للحساب عبر البريد الإلكتروني
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


