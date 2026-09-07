// src/app/api/auth/register/route.ts
// POST /api/auth/register
// ينشئ حساب مستخدم جديد (عميل). يشفّر كلمة المرور بأمان مع دعم التوافق التام

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { registerSchema } from "@/lib/validation";
import { sanitizeInput } from "@/lib/sanitize";
import { hashPassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const rawBody = await req.json();
    const body = sanitizeInput(rawBody);

    // 1. التحقق من صحة البيانات المُرسلة
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { status: "error", message: "بيانات غير صحيحة", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { name, email, password, phone, address } = parsed.data;

    // 2. التأكد أن البريد الإلكتروني غير مستخدم من قبل
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json(
        { status: "error", message: "هذا البريد الإلكتروني مستخدم بالفعل" },
        { status: 409 }
      );
    }

    // 3. تشفير كلمة المرور
    const hashedPassword = await hashPassword(password);

    // 4. توليد رمز تحقق رقمي مكون من 6 أرقام (OTP)
    const verificationCode = crypto.randomInt(100000, 1000000).toString();
    const emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");

    // 5. إنشاء المستخدم في قاعدة البيانات
    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone,
      address,
      role: "customer",
      emailVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationToken,
      emailVerificationExpires,
      loyaltyPoints: 50, // مكافأة تسجيل ترحيبية 50 نقطة
    });

    // 6. إرسال رمز المصادقة للبريد الإلكتروني
    try {
      const { sendVerificationCodeEmail } = await import("@/lib/mailer");
      await sendVerificationCodeEmail(user.email, user.name, verificationCode);
    } catch (emailError) {
      console.error("⚠️ تعذّر إرسال رمز التفعيل، لكن الحساب أُنشئ بنجاح:", emailError);
    }

    return NextResponse.json(
      {
        status: "success",
        message: "تم إنشاء الحساب بنجاح! يرجى إدخال رمز التحقق المُرسل إلى بريدك الإلكتروني",
        email: user.email,
        needsVerification: true,
      },
      { status: 201 }
    );
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
