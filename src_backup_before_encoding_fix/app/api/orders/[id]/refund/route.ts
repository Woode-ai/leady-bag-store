import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { getCurrentUser, requireAdmin } from "@/lib/auth";

const requestSchema = z.object({
  reason: z.string().trim().min(3).max(1000),
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
    const { reason } = requestSchema.parse(await req.json());

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
        { status: "error", message: "غير مصرح لك" },
        { status: 403 }
      );
    }

    if (order.returnStatus && order.returnStatus !== "none") {
      return NextResponse.json(
        { status: "error", message: "يوجد طلب استرجاع مسجل لهذا الطلب بالفعل" },
        { status: 409 }
      );
    }

    const ageMs = Date.now() - order.createdAt.getTime();
    if (ageMs > 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { status: "error", message: "انتهت مهلة طلب الاسترجاع وهي 24 ساعة" },
        { status: 400 }
      );
    }

    if (["cancelled", "returned"].includes(order.status)) {
      return NextResponse.json(
        { status: "error", message: "لا يمكن طلب استرجاع لهذا الطلب" },
        { status: 400 }
      );
    }

    order.returnStatus = "requested";
    order.returnReason = reason;
    order.returnRequestedAt = new Date();
    await order.save();

    return NextResponse.json({
      status: "success",
      message: "تم تقديم طلب الاسترجاع للمراجعة",
      order,
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "بيانات طلب الاسترجاع غير صحيحة" },
      { status: 400 }
    );
  }
}

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
      // This endpoint approves the return workflow. It intentionally does not
      // claim that a Stripe/bank refund has happened.
    }

    await order.save();

    return NextResponse.json({
      status: "success",
      message:
        action === "approve"
          ? "تمت الموافقة على طلب الاسترجاع. يجب تنفيذ الاسترداد المالي عبر مزود الدفع حسب طريقة الدفع."
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
