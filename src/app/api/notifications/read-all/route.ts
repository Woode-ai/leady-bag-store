import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { status: "error", message: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    await connectDB();
    await Notification.updateMany(
      { userId: user.userId, isRead: false },
      { $set: { isRead: true } }
    );

    return NextResponse.json({
      status: "success",
      message: "تم وضع الإشعارات كمقروءة",
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "حدث خطأ في السيرفر" },
      { status: 500 }
    );
  }
}


