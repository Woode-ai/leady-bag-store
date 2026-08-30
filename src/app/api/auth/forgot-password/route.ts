// src/app/api/auth/forgot-password/route.ts
// POST /api/auth/forgot-password
// يولّد رمز OTP لإعادة تعيين كلمة المرور، يحفظه في حساب المستخدم (مشفّراً بصلاحية 15 دقيقة)
// ثم يرسله عبر البريد الإلكتروني. لا نكشف أبداً هل البريد المُدخل مسجّل لدينا أم لا
// (نفس الرسالة في الحالتين) حتى لا يستطيع أي شخص التحقق من قائمة عملائنا بالبريد الإلكتروني

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const GENERIC_MESSAGE =
  "إذا كان هذا البريد الإلكتروني مسجلاً لدينا، فقد أُرسل إليه رمز إعادة التعيين";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "البريد الإلكتروني مطلوب" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // حماية من إساءة الاستخدام (إغراق بريد شخص آخر برسائل OTP أو محاولة استكشاف الحسابات المسجلة)
    // نحد المحاولات حسب (IP + البريد) معاً، بنفس آلية الحماية المستخدمة في تسجيل الدخول
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`forgot-password:${clientIp}:${normalizedEmail}`);
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
    const user = await User.findOne({ email: normalizedEmail });

    // لا نكشف عدم وجود الحساب - نعيد نفس الرسالة دائماً (يمنع تعداد/اكتشاف البريد الإلكتروني للعملاء)
    if (user) {
      const otp = crypto.randomInt(100000, 1000000).toString();
      user.passwordResetCode = otp;
      user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // صالح 15 دقيقة
      await user.save();

      try {
        await sendPasswordResetEmail(user.email, user.name, otp);
      } catch (emailError) {
        console.error("⚠️ تعذّر إرسال بريد استعادة كلمة المرور:", emailError);
      }
    }

    return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
  } catch (error: unknown) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}


