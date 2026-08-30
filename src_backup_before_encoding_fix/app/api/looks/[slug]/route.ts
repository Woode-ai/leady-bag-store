// src/app/api/looks/[slug]/route.ts
// GET    /api/looks/:slug → تفاصيل إطلالة واحدة مع كل منتجاتها
// PUT    /api/looks/:slug → تعديل إطلالة (أدمن فقط)
// DELETE /api/looks/:slug → حذف إطلالة (أدمن فقط)

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Look from "@/models/Look";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    await connectDB();
    const look = await Look.findOne({ slug })
      .populate("products", "name price discountPrice images stock sizes colors");

    if (!look) {
      return NextResponse.json({ status: "error", message: "الإطلالة غير موجودة" }, { status: 404 });
    }

    const originalTotal = (look.products as any[]).reduce((sum, p) => {
      return sum + (p?.discountPrice || p?.price || 0);
    }, 0);

    return NextResponse.json({
      status: "success",
      look: {
        ...look.toObject(),
        originalTotal,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "حدث خطأ في السيرفر", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? error.message : String(error)) }) },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { status: "error", message: "غير مصرح لك - هذا الإجراء للأدمن فقط" },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await req.json();

    const look = await Look.findOneAndUpdate({ slug }, body, { new: true });
    if (!look) {
      return NextResponse.json({ status: "error", message: "الإطلالة غير موجودة" }, { status: 404 });
    }

    return NextResponse.json({ status: "success", message: "تم تعديل الإطلالة بنجاح", look });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "حدث خطأ في السيرفر", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? error.message : String(error)) }) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { status: "error", message: "غير مصرح لك - هذا الإجراء للأدمن فقط" },
        { status: 403 }
      );
    }

    await connectDB();
    const look = await Look.findOneAndDelete({ slug });
    if (!look) {
      return NextResponse.json({ status: "error", message: "الإطلالة غير موجودة" }, { status: 404 });
    }

    return NextResponse.json({ status: "success", message: "تم حذف الإطلالة بنجاح" });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "حدث خطأ في السيرفر", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? error.message : String(error)) }) },
      { status: 500 }
    );
  }
}
