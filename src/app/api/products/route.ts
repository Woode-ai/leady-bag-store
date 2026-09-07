// src/app/api/products/route.ts
// GET  /api/products  → عرض المنتجات مع دعم البحث والفلاتر والترقيم وحماية البيانات الحساسة
// POST /api/products → إضافة منتج جديد (أدمن فقط)

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { productSchema } from "@/lib/validation";
import { escapeRegex } from "@/lib/sanitize";
import { getCached, setCached, getCacheVersion, bumpCacheVersion } from "@/lib/redis";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // التحقق مما إذا كان المستخدم أدمن لمعرفة ما إذا كان مسموحاً بعرض سعر الشراء (purchasePrice)
    const currentUser = getCurrentUser(req);
    const isAdmin = currentUser?.role === "admin";

    const version = await getCacheVersion("products");
    const cacheKey = `products:v${version}:${isAdmin ? "admin" : "pub"}:${searchParams.toString()}`;

    const cached = await getCached<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, _cached: true });
    }

    await connectDB();

    const rawPage = Number.parseInt(searchParams.get("page") || "1", 10);
    const rawLimit = Number.parseInt(searchParams.get("limit") || "12", 10);
    const page = Number.isFinite(rawPage) ? Math.min(Math.max(rawPage, 1), 100000) : 1;
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 12;
    const category = searchParams.get("category");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const search = searchParams.get("search");
    const color = searchParams.get("color");
    const size = searchParams.get("size");
    const inStockOnly = searchParams.get("inStock") === "true";
    const minRating = searchParams.get("minRating");
    const sort = searchParams.get("sort") || "newest";

    const filter: any = {};

    if (category) filter.categoryId = category;
    if (color) filter.colors = color;
    if (size) filter.sizes = size;
    if (inStockOnly) filter.stock = { $gt: 0 };

    if (minPrice || maxPrice) {
      const min = minPrice === null ? undefined : Number(minPrice);
      const max = maxPrice === null ? undefined : Number(maxPrice);
      if ((min !== undefined && !Number.isFinite(min)) || (max !== undefined && !Number.isFinite(max))) {
        return NextResponse.json(
          { status: "error", message: "نطاق السعر غير صحيح" },
          { status: 400 }
        );
      }
      if (min !== undefined && max !== undefined && min > max) {
        return NextResponse.json(
          { status: "error", message: "الحد الأدنى للسعر أكبر من الحد الأعلى" },
          { status: 400 }
        );
      }
      filter.price = {};
      if (min !== undefined) filter.price.$gte = min;
      if (max !== undefined) filter.price.$lte = max;
    }

    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { "name.ar": { $regex: safeSearch, $options: "i" } },
        { "name.en": { $regex: safeSearch, $options: "i" } },
        { "description.ar": { $regex: safeSearch, $options: "i" } },
        { "description.en": { $regex: safeSearch, $options: "i" } },
      ];
    }

    let sortOption: any = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { price: 1 };
    if (sort === "price_desc") sortOption = { price: -1 };
    if (sort === "newest") sortOption = { createdAt: -1 };
    if (sort === "popular") sortOption = { "ratings.length": -1, createdAt: -1 };

    // حماية البيانات: عدم تسريب purchasePrice لغير الأدمن أبداً
    const selectFields = isAdmin
      ? "name purchasePrice price discountPrice images categoryId stock sizes colors ratings createdAt updatedAt"
      : "name price discountPrice images categoryId stock sizes colors ratings createdAt updatedAt";

    let products = await Product.find(filter)
      .select(selectFields)
      .populate("categoryId", "name slug")
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    if (minRating) {
      const minRatingNum = Number(minRating);
      if (!Number.isFinite(minRatingNum) || minRatingNum < 0 || minRatingNum > 5) {
        return NextResponse.json(
          { status: "error", message: "قيمة التقييم غير صحيحة" },
          { status: 400 }
        );
      }
      products = products.filter((p: any) => {
        if (!p.ratings || p.ratings.length === 0) return false;
        const avg = p.ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / p.ratings.length;
        return avg >= minRatingNum;
      });
    }

    const total = await Product.countDocuments(filter);

    const responseBody = {
      status: "success",
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await setCached(cacheKey, responseBody, 60);

    return NextResponse.json(responseBody);
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

    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { status: "error", message: "بيانات غير صحيحة", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const product = await Product.create({ ...parsed.data, ratings: [] });
    await bumpCacheVersion("products");

    return NextResponse.json(
      { status: "success", message: "تم إضافة المنتج بنجاح", product },
      { status: 201 }
    );
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
