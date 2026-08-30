// src/app/api/settings/route.ts
// GET /api/settings → إعدادات المتجر العامة (رقم واتساب + صورة رمز QR) - قراءة عامة، لا تحتاج تسجيل دخول
//                      (يستخدمها زر الواتساب العائم الذي يظهر لكل زوار الموقع)
// PUT /api/settings → تعديل الإعدادات (أدمن فقط)

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Settings from "@/models/Settings";
import { requireAdmin } from "@/lib/auth";
import { settingsSchema } from "@/lib/validation";

// وثيقة واحدة فقط في هذا الكولكشن دائماً - هذه الدالة تجلبها أو تُنشئها إن لم تكن موجودة بعد
async function getOrCreateSettings() {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
}

export async function GET() {
  try {
    await connectDB();
    const settings = await getOrCreateSettings();

    // نُعيد فقط الحقول الآمنة للعرض العام (لا يوجد حالياً أي حقل حساس هنا، لكن نُبقي القائمة صريحة
    // بدل إعادة الوثيقة كاملة، تحسباً لأي حقل إداري حساس يُضاف مستقبلاً لنفس النموذج)
    return NextResponse.json({
      status: "success",
      settings: {
        whatsappNumber: settings.whatsappNumber || "",
        whatsappQrImage: settings.whatsappQrImage || "",
        pointsPerCurrencySpent: settings.pointsPerCurrencySpent || 1,
        currencyValuePerPoint: settings.currencyValuePerPoint || 10,
        minPointsToRedeem: settings.minPointsToRedeem || 10,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "حدث خطأ في السيرفر", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
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

    const parsed = settingsSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { status: "error", message: "بيانات غير صحيحة", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const settings = await getOrCreateSettings();
    Object.assign(settings, parsed.data);
    await settings.save();

    return NextResponse.json({ status: "success", message: "تم حفظ الإعدادات بنجاح", settings });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "حدث خطأ في السيرفر", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


