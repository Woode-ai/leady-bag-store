// src/app/api/orders/[id]/upload-receipt/route.ts
// POST /api/orders/[id]/upload-receipt
//
// يستقبل صورة إشعار الدفع + رقم المعاملة من العميل.
// يرفع الصورة إلى Cloudinary ثم يحفظ رابطها داخل الطلب.
//
// مهم:
// - العميل لا يرسل URL للصورة.
// - العميل يرسل الصورة نفسها عبر FormData.
// - يسمح فقط لصاحب الطلب برفع الإشعار.
// - الصور المسموحة: JPEG / PNG / WEBP / GIF.
// - الحد الأقصى: 5MB.

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { getCurrentUser } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

function hasValidSignature(type: string, data: Buffer): boolean {
  if (type === "image/jpeg") {
    return (
      data.length >= 3 &&
      data[0] === 0xff &&
      data[1] === 0xd8 &&
      data[2] === 0xff
    );
  }

  if (type === "image/png") {
    return (
      data.length >= 8 &&
      data
        .subarray(0, 8)
        .equals(
          Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
        )
    );
  }

  if (type === "image/gif") {
    return (
      data.length >= 6 &&
      ["GIF87a", "GIF89a"].includes(
        data.subarray(0, 6).toString("ascii")
      )
    );
  }

  if (type === "image/webp") {
    return (
      data.length >= 12 &&
      data.subarray(0, 4).toString("ascii") === "RIFF" &&
      data.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }

  return false;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // التحقق من تسجيل الدخول
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return NextResponse.json(
        {
          status: "error",
          message: "يجب تسجيل الدخول",
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    // التحقق من إعدادات Cloudinary
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "رفع الصور غير مُفعّل حالياً. يرجى التواصل مع الإدارة.",
        },
        { status: 500 }
      );
    }

    await connectDB();

    // البحث عن الطلب
    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        {
          status: "error",
          message: "الطلب غير موجود",
        },
        { status: 404 }
      );
    }

    // التأكد أن الطلب يخص المستخدم الحالي
    if (order.userId.toString() !== currentUser.userId) {
      return NextResponse.json(
        {
          status: "error",
          message: "غير مصرح لك بتعديل هذا الطلب",
        },
        { status: 403 }
      );
    }

    // يجب أن يكون الدفع عن طريق التحويل البنكي
    if (order.paymentMethod.type !== "bank_transfer") {
      return NextResponse.json(
        {
          status: "error",
          message: "هذا الطلب لا يستخدم التحويل البنكي",
        },
        { status: 400 }
      );
    }

    // لا نسمح برفع إشعار بعد اعتماد الدفع
    if (
      order.paymentStatus === "paid" ||
      order.paymentStatus === "verified"
    ) {
      return NextResponse.json(
        {
          status: "error",
          message: "تم اعتماد دفع هذا الطلب مسبقاً",
        },
        { status: 409 }
      );
    }

    // استقبال FormData
    const formData = await req.formData();

    const file = formData.get("file");
    const transactionReferenceValue = formData.get(
      "transactionReference"
    );

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          status: "error",
          message: "يرجى اختيار صورة إشعار الدفع",
        },
        { status: 400 }
      );
    }

    if (typeof transactionReferenceValue !== "string") {
      return NextResponse.json(
        {
          status: "error",
          message: "يرجى إدخال رقم المعاملة",
        },
        { status: 400 }
      );
    }

    const transactionReference =
      transactionReferenceValue.trim();

    if (transactionReference.length < 3) {
      return NextResponse.json(
        {
          status: "error",
          message: "رقم المعاملة يجب أن يحتوي على 3 أحرف أو أرقام على الأقل",
        },
        { status: 400 }
      );
    }

    if (transactionReference.length > 100) {
      return NextResponse.json(
        {
          status: "error",
          message: "رقم المعاملة طويل جداً",
        },
        { status: 400 }
      );
    }

    // التحقق من نوع الصورة
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "صيغة الصورة غير مدعومة. المسموح: JPEG, PNG, WEBP, GIF فقط",
        },
        { status: 400 }
      );
    }

    // التحقق من الحجم
    if (file.size <= 0) {
      return NextResponse.json(
        {
          status: "error",
          message: "الصورة فارغة أو غير صالحة",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        {
          status: "error",
          message: "حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت",
        },
        { status: 400 }
      );
    }

    // تحويل الصورة إلى Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // التأكد أن محتوى الملف يطابق نوع الصورة
    if (!hasValidSignature(file.type, buffer)) {
      return NextResponse.json(
        {
          status: "error",
          message: "محتوى الملف لا يطابق نوع الصورة المعلن",
        },
        { status: 400 }
      );
    }

    // تحويل الصورة إلى Base64
    const base64 = `data:${file.type};base64,${buffer.toString(
      "base64"
    )}`;

    // رفع الإشعار إلى Cloudinary داخل مجلد مستقل
    const uploadResult = await cloudinary.uploader.upload(
      base64,
      {
        folder: "leadybag/receipts",
        resource_type: "image",
        transformation: [
          {
            quality: "auto",
          },
          {
            fetch_format: "auto",
          },
        ],
      }
    );

    // حفظ البيانات في الطلب
    order.receiptImage = uploadResult.secure_url;
    order.transactionReference = transactionReference;
    order.paymentStatus = "pending_verification";

    // إذا كان هناك سبب رفض سابق، نمسحه عند إعادة رفع إشعار جديد
    order.rejectionReason = undefined;

    await order.save();

    return NextResponse.json({
      status: "success",
      message:
        "تم رفع إشعار الدفع بنجاح وسيتم مراجعته من فريق العمل",
      order,
    });
  } catch (error: unknown) {
    console.error("Upload receipt error:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "حدث خطأ أثناء رفع إشعار الدفع",
        ...(process.env.NODE_ENV !== "production" && {
          error:
            error instanceof Error
              ? error.message
              : String(error),
        }),
      },
      { status: 500 }
    );
  }
}