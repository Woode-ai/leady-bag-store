// src/app/api/upload/route.ts
// POST /api/upload
// يستقبل صورة من لوحة تحكم الأدمن، يرفعها إلى Cloudinary، ويعيد رابطها النهائي
// هذا الرابط هو ما نخزّنه في حقل images داخل المنتج (Product.images)
//
// يجب إرسال الصورة كـ FormData (وليس JSON) مع حقل اسمه "file"

import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { status: "error", message: "غير مصرح لك - رفع الصور للأدمن فقط" },
        { status: 403 }
      );
    }

    // السبب الأشهر لفشل رفع الصور هو نسيان تعبئة بيانات Cloudinary في .env.local
    // نتحقق من هذا صراحة أولاً ونعطي رسالة واضحة، بدل رسالة Cloudinary التقنية المبهمة
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "رفع الصور غير مُفعَّل بعد - أضف CLOUDINARY_CLOUD_NAME و CLOUDINARY_API_KEY و CLOUDINARY_API_SECRET في ملف .env.local (احصل عليها من لوحة تحكم Cloudinary)، ثم أعد تشغيل السيرفر",
        },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const requestedFolder = formData.get("folder") as string | null;

    if (!file) {
      return NextResponse.json(
        { status: "error", message: "لم يتم إرسال أي ملف" },
        { status: 400 }
      );
    }

    // نتأكد أن الملف صورة فعلاً (وليس ملفاً تنفيذياً أو شيئاً خطيراً)
    // نرفض صراحة SVG لأنه يمكن أن يحتوي كود JavaScript مضمّن (<script> داخل ملف SVG) وهو نوع
    // معروف من هجمات XSS المخزّن (Stored XSS): لو فتح أحد الرابط مباشرة في المتصفح، قد يُنفَّذ الكود
    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedImageTypes.includes(file.type)) {
      return NextResponse.json(
        { status: "error", message: "صيغة الصورة غير مدعومة - المسموح: JPEG, PNG, WEBP, GIF فقط" },
        { status: 400 }
      );
    }

    // حد أقصى 5 ميجابايت للصورة الواحدة - يمنع رفع ملفات ضخمة عن طريق الخطأ تُبطئ الموقع
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { status: "error", message: "حجم الصورة كبير جداً - الحد الأقصى 5 ميجابايت" },
        { status: 400 }
      );
    }

    // نحوّل الملف إلى buffer ثم إلى base64 لنرفعه إلى Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    function hasValidSignature(type: string, data: Buffer): boolean {
      if (type === "image/jpeg") {
        return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
      }
      if (type === "image/png") {
        return data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      }
      if (type === "image/gif") {
        return data.length >= 6 && ["GIF87a", "GIF89a"].includes(data.subarray(0, 6).toString("ascii"));
      }
      if (type === "image/webp") {
        return data.length >= 12 &&
          data.subarray(0, 4).toString("ascii") === "RIFF" &&
          data.subarray(8, 12).toString("ascii") === "WEBP";
      }
      return false;
    }

    if (!hasValidSignature(file.type, buffer)) {
      return NextResponse.json(
        { status: "error", message: "محتوى الملف لا يطابق نوع الصورة المعلن" },
        { status: 400 }
      );
    }

    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    // نسمح فقط بمجلدات محددة مسبقاً (allowlist) - لا نستخدم أي نص يرسله المستخدم مباشرة في مسار الرفع
    // حتى لا يتمكن أحد من التلاعب بمسارات التخزين في حساب Cloudinary
    const allowedFolders: Record<string, string> = {
      products: "leadybag/products",
      settings: "leadybag/settings",
      reviews: "leadybag/reviews",
    };
    const folder = allowedFolders[requestedFolder || ""] || allowedFolders.products;

    const uploadResult = await cloudinary.uploader.upload(base64, {
      folder,
      transformation: [
        { quality: "auto" }, // ضغط تلقائي ذكي للصورة
        { fetch_format: "auto" }, // يحوّلها تلقائياً لـ WebP في المتصفحات التي تدعمها
      ],
    });

    return NextResponse.json({
      status: "success",
      message: "تم رفع الصورة بنجاح",
      url: uploadResult.secure_url,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "فشل رفع الصورة", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


