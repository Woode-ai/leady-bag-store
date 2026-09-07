// src/app/api/products/search/route.ts
// GET /api/products/search?q=query
// نقطة نهاية مخصصة للبحث الفوري الذكي والحي (Live Search / Autocomplete)
// تعيد اقتراحات المنتجات مع الصور والأسعار والأقسام وحالة التوفر بسرعة فائقة

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { escapeRegex } from "@/lib/sanitize";
import { getCached, setCached, getCacheVersion } from "@/lib/redis";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || searchParams.get("search") || "";
    const limit = Math.min(Math.max(Number.parseInt(searchParams.get("limit") || "6", 10), 1), 20);

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return NextResponse.json({ status: "success", suggestions: [] });
    }

    const version = await getCacheVersion("products");
    const cacheKey = `search_suggestions:v${version}:${trimmedQuery.toLowerCase()}:${limit}`;
    const cached = await getCached<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, _cached: true });
    }

    await connectDB();

    const safeSearch = escapeRegex(trimmedQuery);
    const searchRegex = { $regex: safeSearch, $options: "i" };

    const suggestions = await Product.find({
      $or: [
        { "name.ar": searchRegex },
        { "name.en": searchRegex },
        { "description.ar": searchRegex },
        { "description.en": searchRegex },
      ],
    })
      .select("name price discountPrice images categoryId stock")
      .populate("categoryId", "name slug")
      .sort({ stock: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    const responseData = {
      status: "success",
      query: trimmedQuery,
      totalMatches: suggestions.length,
      suggestions: suggestions.map((p: any) => ({
        _id: p._id.toString(),
        name: p.name,
        price: p.price,
        discountPrice: p.discountPrice,
        image: p.images?.[0] || null,
        category: p.categoryId ? { name: p.categoryId.name, slug: p.categoryId.slug } : null,
        inStock: p.stock > 0,
        stock: p.stock,
      })),
    };

    await setCached(cacheKey, responseData, 120);

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    return NextResponse.json(
      {
        status: "error",
        message: "حدث خطأ أثناء البحث",
        ...(process.env.NODE_ENV !== "production" && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
