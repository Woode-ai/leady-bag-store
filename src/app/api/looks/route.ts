// src/app/api/looks/route.ts
// GET  /api/looks → قائمة بكل الإطلالات المفعلة (متاح للجميع)
// POST /api/looks → إنشاء إطلالة جديدة (أدمن فقط)

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Look from "@/models/Look";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await connectDB();
    const looks = await Look.find({ isActive: true })
      .populate("products", "name price discountPrice images stock")
      .sort({ createdAt: -1 });

    // حساب إجمالي الأسعار الأصلية لكل إطلالة لإظهار التوفير
    const formattedLooks = looks.map((look) => {
      const originalTotal = (look.products as any[]).reduce((sum, p) => {
        return sum + (p?.discountPrice || p?.price || 0);
      }, 0);

      return {
        ...look.toObject(),
        originalTotal,
      };
    });

    return NextResponse.json({ status: "success", looks: formattedLooks });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "حدث خطأ في السيرفر", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
    const { title, slug, description, imageUrl, bundlePrice, products, isActive } = body;

    if (!title?.ar || !title?.en || !slug || !imageUrl || bundlePrice === undefined) {
      return NextResponse.json(
        { status: "error", message: "يرجى تعبئة كافة الحقول الإلزامية للإطلالة" },
        { status: 400 }
      );
    }

    const cleanSlug = slug.toLowerCase().replace(/\s+/g, "-");
    const existing = await Look.findOne({ slug: cleanSlug });
    if (existing) {
      return NextResponse.json(
        { status: "error", message: "يوجد إطلالة أخرى بنفس الرابط (Slug)" },
        { status: 409 }
      );
    }

    const look = await Look.create({
      title,
      slug: cleanSlug,
      description: description || { ar: "", en: "" },
      imageUrl,
      bundlePrice: Number(bundlePrice),
      products: products || [],
      isActive: isActive ?? true,
    });

    return NextResponse.json(
      { status: "success", message: "تم إنشاء الإطلالة بنجاح", look },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "حدث خطأ في السيرفر", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


