// src/app/api/payment-methods/[id]/route.ts
// PUT    /api/payment-methods/:id → تعديل طريقة دفع (أدمن فقط) - يشمل تفعيل/تعطيل
// DELETE /api/payment-methods/:id → حذف طريقة دفع (أدمن فقط)
//
// ملاحظة: حذف طريقة دفع لا يؤثر على الطلبات القديمة التي استُخدمت فيها - انظر src/models/Order.ts
// حيث نحتفظ بلقطة (snapshot) من اسمها ونوعها وقت كل عملية شراء

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import PaymentMethod from "@/models/PaymentMethod";
import { requireAdmin } from "@/lib/auth";
import { paymentMethodSchema } from "@/lib/validation";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { status: "error", message: "غير مصرح لك - هذا الإجراء للأدمن فقط" },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await req.json();

    // نسمح بتعديل جزئي - مثلاً تبديل isActive فقط دون إرسال باقي الحقول
    const parsed = paymentMethodSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { status: "error", message: "بيانات غير صحيحة", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const paymentMethod = await PaymentMethod.findByIdAndUpdate(id, parsed.data, { new: true });
    if (!paymentMethod) {
      return NextResponse.json({ status: "error", message: "طريقة الدفع غير موجودة" }, { status: 404 });
    }

    return NextResponse.json({ status: "success", message: "تم تعديل طريقة الدفع بنجاح", paymentMethod });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "حدث خطأ في السيرفر", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? error.message : String(error)) }) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { status: "error", message: "غير مصرح لك - هذا الإجراء للأدمن فقط" },
        { status: 403 }
      );
    }

    await connectDB();
    const paymentMethod = await PaymentMethod.findByIdAndDelete(id);
    if (!paymentMethod) {
      return NextResponse.json({ status: "error", message: "طريقة الدفع غير موجودة" }, { status: 404 });
    }

    return NextResponse.json({ status: "success", message: "تم حذف طريقة الدفع بنجاح" });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "حدث خطأ في السيرفر", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? error.message : String(error)) }) },
      { status: 500 }
    );
  }
}
