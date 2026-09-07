// src/app/api/auth/2fa/disable/route.ts
// POST /api/auth/2fa/disable
// يعطّل 2FA - نطلب كلمة المرور الحالية للتأكيد (حتى لا يستطيع أي شخص وصل للجهاز مفتوحاً تعطيلها بسهولة)

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { requireAdmin } from "@/lib/auth";
import { comparePassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { status: "error", message: "غير مصرح لك" },
        { status: 403 }
      );
    }

    await connectDB();
    const { password } = await req.json();

    const user = await User.findById(admin.userId).select("+password");
    if (!user) {
      return NextResponse.json({ status: "error", message: "المستخدم غير موجود" }, { status: 404 });
    }

    const isPasswordCorrect = await comparePassword(password || "", user.password);
    if (!isPasswordCorrect) {
      return NextResponse.json(
        { status: "error", message: "كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    return NextResponse.json({ status: "success", message: "تم تعطيل المصادقة الثنائية بنجاح" });
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
