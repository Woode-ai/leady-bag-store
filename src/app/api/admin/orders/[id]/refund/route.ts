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
    const { action } = await req.json();

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { status: "error", message: "الإجراء غير صحيح" },
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

    if (order.returnStatus !== "requested") {
      return NextResponse.json(
        { status: "error", message: "لا يوجد طلب استرجاع قيد المراجعة" },
        { status: 409 }
      );
    }

    order.returnStatus = action === "approve" ? "approved" : "rejected";
    if (action === "approve") {
      order.status = "returned";
    }

    await order.save();

    return NextResponse.json({
      status: "success",
      message:
        action === "approve"
          ? "تمت الموافقة على الاسترجاع. نفّذ الاسترداد المالي عبر مزود الدفع بشكل منفصل."
          : "تم رفض طلب الاسترجاع",
      order,
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "حدث خطأ في السيرفر" },
      { status: 500 }
    );
  }
}
