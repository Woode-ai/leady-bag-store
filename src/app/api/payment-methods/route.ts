// src/app/api/payment-methods/route.ts
// GET  /api/payment-methods → قائمة طرق الدفع
//   - بدون تسجيل دخول كأدمن: تُعاد فقط الطرق المفعّلة (isActive: true) - هذا ما تستخدمه صفحة الدفع للعميل
//   - مع توكن أدمن صحيح: تُعاد كل الطرق (مفعّلة وغير مفعّلة) - لعرضها في لوحة التحكم
// POST /api/payment-methods → إضافة طريقة دفع جديدة (أدمن فقط)

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import PaymentMethod from "@/models/PaymentMethod";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { paymentMethodSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const currentUser = getCurrentUser(req);
    const isAdmin = currentUser?.role === "admin";

    const filter = isAdmin ? {} : { isActive: true };
    const paymentMethods = await PaymentMethod.find(filter).sort({ sortOrder: 1, createdAt: 1 });

    return NextResponse.json({ status: "success", paymentMethods });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "حدث خطأ في السيرفر", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { status: "error", message: "غير مصرح لك - هذا الإجراء للأدمن فقط" },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await req.json();

    const parsed = paymentMethodSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { status: "error", message: "بيانات غير صحيحة", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const paymentMethod = await PaymentMethod.create(parsed.data);

    return NextResponse.json(
      { status: "success", message: "تم إضافة طريقة الدفع بنجاح", paymentMethod },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "حدث خطأ في السيرفر", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


