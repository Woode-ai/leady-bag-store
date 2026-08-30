import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { getCurrentUser } from "@/lib/auth";

const receiptSchema = z.object({
  receiptImage: z.string().url().max(2048).optional(),
  transactionReference: z.string().trim().min(3).max(100),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json(
        { status: "error", message: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const parsed = receiptSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json(
        { status: "error", message: "بيانات الإيصال غير صحيحة" },
        { status: 400 }
      );
    }

    await connectDB();
    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        { status: "error", message: "الطلب غير موجود" },
        { status: 404 }
      );
    }

    if (order.userId.toString() !== currentUser.userId) {
      return NextResponse.json(
        { status: "error", message: "غير مصرح لك بتعديل هذا الطلب" },
        { status: 403 }
      );
    }

    if (order.paymentMethod.type !== "bank_transfer") {
      return NextResponse.json(
        { status: "error", message: "هذا الطلب لا يستخدم التحويل البنكي" },
        { status: 400 }
      );
    }

    if (order.paymentStatus === "paid" || order.paymentStatus === "verified") {
      return NextResponse.json(
        { status: "error", message: "تم اعتماد دفع هذا الطلب مسبقاً" },
        { status: 409 }
      );
    }

    order.receiptImage = parsed.data.receiptImage;
    order.transactionReference = parsed.data.transactionReference;
    order.paymentStatus = "pending_verification";
    await order.save();

    return NextResponse.json({
      status: "success",
      message: "تم رفع إشعار الدفع وسيتم مراجعته",
      order,
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "حدث خطأ في السيرفر" },
      { status: 500 }
    );
  }
}
