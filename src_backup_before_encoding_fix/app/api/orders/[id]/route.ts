// src/app/api/orders/[id]/route.ts
// GET /api/orders/:id → تفاصيل طلب واحد (العميل صاحب الطلب أو الأدمن فقط)
// PUT /api/orders/:id → تحديث حالة الطلب (أدمن فقط) - يُستخدم لتحديث الشحن لحظة بلحظة

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { getCurrentUser, requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json(
        { status: "error", message: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    const { id } = await params; // Next.js 15: params أصبحت Promise ويجب انتظارها قبل استخدامها
    await connectDB();
    const order = await Order.findById(id).populate("items.productId", "name images");

    if (!order) {
      return NextResponse.json({ status: "error", message: "الطلب غير موجود" }, { status: 404 });
    }

    // العميل يمكنه رؤية طلبه فقط، الأدمن يرى أي طلب
    if (currentUser.role !== "admin" && order.userId.toString() !== currentUser.userId) {
      return NextResponse.json(
        { status: "error", message: "غير مصرح لك برؤية هذا الطلب" },
        { status: 403 }
      );
    }

    return NextResponse.json({ status: "success", order });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "حدث خطأ في السيرفر", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? error.message : String(error)) }) },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; // Next.js 15: params أصبحت Promise ويجب انتظارها قبل استخدامها
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { status: "error", message: "غير مصرح لك - هذا الإجراء للأدمن فقط" },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await req.json();
    const { status, paymentStatus, trackingNumber } = body;

    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled", "returned"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { status: "error", message: "حالة الطلب غير صحيحة" },
        { status: 400 }
      );
    }

    const validPaymentStatuses = ["pending_verification", "verified", "rejected", "pending", "paid", "failed", "cod"];
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return NextResponse.json(
        { status: "error", message: "حالة الدفع غير صحيحة" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;

    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return NextResponse.json({ status: "error", message: "الطلب غير موجود" }, { status: 404 });
    }

    const order = await Order.findByIdAndUpdate(id, updateData, { new: true });
    if (!order) {
      return NextResponse.json({ status: "error", message: "الطلب غير موجود" }, { status: 404 });
    }

    // Award loyalty points only on the first transition to delivered.
    if (status === "delivered" && existingOrder.status !== "delivered") {
      try {
        const User = (await import("@/models/User")).default;
        const Settings = (await import("@/models/Settings")).default;
        const settings = await Settings.findOne();
        const rate = settings?.pointsPerCurrencySpent || 1;
        const earnedPoints = Math.max(5, Math.floor((order.total / 100) * rate));

        await User.findByIdAndUpdate(order.userId, {
          $inc: { loyaltyPoints: earnedPoints },
        });
      } catch (err) {
        console.error("Loyalty points awarding error:", err);
      }
    }

    return NextResponse.json({ status: "success", message: "تم تحديث الطلب بنجاح", order });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "حدث خطأ في السيرفر", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? error.message : String(error)) }) },
      { status: 500 }
    );
  }
}
