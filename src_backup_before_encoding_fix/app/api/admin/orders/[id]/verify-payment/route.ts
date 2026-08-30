import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { status: "error", message: "غير مصرح لك" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!["verified", "rejected"].includes(status)) {
      return NextResponse.json(
        { status: "error", message: "حالة الدفع غير صحيحة" },
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

    if (order.paymentMethod.type !== "bank_transfer") {
      return NextResponse.json(
        { status: "error", message: "هذا الطلب ليس تحويلًا بنكياً" },
        { status: 400 }
      );
    }

    order.paymentStatus = status;
    if (status === "verified" && order.status === "pending") {
      order.status = "processing";
    }

    await order.save();

    return NextResponse.json({
      status: "success",
      message:
        status === "verified"
          ? "تم اعتماد الدفع"
          : "تم رفض إثبات الدفع",
      order,
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "حدث خطأ في السيرفر" },
      { status: 500 }
    );
  }
}
