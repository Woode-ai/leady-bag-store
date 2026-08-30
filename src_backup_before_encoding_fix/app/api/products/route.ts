// src/app/api/products/route.ts
// GET  /api/products  â†’ Ø¹Ø±Ø¶ Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ù…Ø¹ Ø¯Ø¹Ù… Ø§Ù„Ø¨Ø­Ø« ÙˆØ§Ù„ÙÙ„Ø§ØªØ± ÙˆØ§Ù„ØªØ±Ù‚ÙŠÙ…
//   Ø£Ù…Ø«Ù„Ø© Ø¹Ù„Ù‰ Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù…:
//   /api/products?page=1&limit=12
//   /api/products?category=<categoryId>
//   /api/products?minPrice=100&maxPrice=500
//   /api/products?search=Ø­Ù‚ÙŠØ¨Ø©
//   /api/products?color=Ø£Ø³ÙˆØ¯&size=M
//   /api/products?sort=price_asc  (Ø£Ùˆ price_desc Ø£Ùˆ newest)
//
// POST /api/products â†’ Ø¥Ø¶Ø§ÙØ© Ù…Ù†ØªØ¬ Ø¬Ø¯ÙŠØ¯ (Ø£Ø¯Ù…Ù† ÙÙ‚Ø·)

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/auth";
import { productSchema } from "@/lib/validation";
import { escapeRegex } from "@/lib/sanitize";
import { getCached, setCached, getCacheVersion, bumpCacheVersion } from "@/lib/redis";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Ù…ÙØªØ§Ø­ Ø§Ù„ÙƒØ§Ø´ ÙŠØ´Ù…Ù„ ÙƒÙ„ Ù…Ø¹Ø§ÙŠÙŠØ± Ø§Ù„Ø¨Ø­Ø«/Ø§Ù„ÙÙ„ØªØ±Ø© + Ø±Ù‚Ù… Ø§Ù„Ø¥ØµØ¯Ø§Ø± Ø§Ù„Ø­Ø§Ù„ÙŠ
    // Ø¨Ù‡Ø°Ø§ØŒ ÙƒÙ„ ØªØ±ÙƒÙŠØ¨Ø© ÙÙ„Ø§ØªØ± Ù…Ø®ØªÙ„ÙØ© (Ø³Ø¹Ø±/Ù‚Ø³Ù…/Ø¨Ø­Ø«..) Ù„Ù‡Ø§ ÙƒØ§Ø´ Ù…Ù†ÙØµÙ„ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹
    const version = await getCacheVersion("products");
    const cacheKey = `products:v${version}:${searchParams.toString()}`;

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
    const minRating = searchParams.get("minRating");
    const sort = searchParams.get("sort") || "newest";

    // Ù†Ø¨Ù†ÙŠ "ÙÙ„ØªØ±" mongoose ØªØ¯Ø±ÙŠØ¬ÙŠØ§Ù‹ Ø­Ø³Ø¨ Ù…Ø§ Ø£ÙØ±Ø³Ù„ Ù…Ù† Ù…Ø¹Ø§ÙŠÙŠØ±
    const filter: any = {};

    if (category) filter.categoryId = category;
    if (color) filter.colors = color;
    if (size) filter.sizes = size;

    if (minPrice || maxPrice) {
      const min = minPrice === null ? undefined : Number(minPrice);
      const max = maxPrice === null ? undefined : Number(maxPrice);
      if ((min !== undefined && !Number.isFinite(min)) || (max !== undefined && !Number.isFinite(max))) {
        return NextResponse.json(
          { status: "error", message: "Ù†Ø·Ø§Ù‚ Ø§Ù„Ø³Ø¹Ø± ØºÙŠØ± ØµØ­ÙŠØ­" },
          { status: 400 }
        );
      }
      if (min !== undefined && max !== undefined && min > max) {
        return NextResponse.json(
          { status: "error", message: "Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ø¯Ù†Ù‰ Ù„Ù„Ø³Ø¹Ø± Ø£ÙƒØ¨Ø± Ù…Ù† Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ø¹Ù„Ù‰" },
          { status: 400 }
        );
      }
      filter.price = {};
      if (min !== undefined) filter.price.$gte = min;
      if (max !== undefined) filter.price.$lte = max;
    }

    if (search) {
      // Ù†Ù‡Ø±Ù‘Ø¨ Ø§Ù„Ø£Ø­Ø±Ù Ø§Ù„Ø®Ø§ØµØ© Ø£ÙˆÙ„Ø§Ù‹ Ù„Ù…Ù†Ø¹ Ù‡Ø¬Ù…Ø§Øª ReDoSØŒ Ø«Ù… Ù†Ø¨Ø­Ø« ÙÙŠ Ø§Ø³Ù… Ø§Ù„Ù…Ù†ØªØ¬ Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© Ø£Ùˆ Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { "name.ar": { $regex: safeSearch, $options: "i" } },
        { "name.en": { $regex: safeSearch, $options: "i" } },
      ];
    }

    // ØªØ±ØªÙŠØ¨ Ø§Ù„Ù†ØªØ§Ø¦Ø¬
    let sortOption: any = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { price: 1 };
    if (sort === "price_desc") sortOption = { price: -1 };
    if (sort === "newest") sortOption = { createdAt: -1 };

    let products = await Product.find(filter)
      .select("name price discountPrice images categoryId stock sizes colors ratings.rating createdAt updatedAt")
      .populate("categoryId", "name slug")
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    // ÙÙ„ØªØ±Ø© Ø§Ù„ØªÙ‚ÙŠÙŠÙ… Ø§Ù„Ø£Ø¯Ù†Ù‰ (Ù†Ø­Ø³Ø¨Ù‡Ø§ Ø¨Ø¹Ø¯ Ø§Ù„Ø¬Ù„Ø¨ Ù„Ø£Ù†Ù‡Ø§ Ù…ØªÙˆØ³Ø· ÙˆÙ„ÙŠØ³Øª Ø­Ù‚Ù„Ø§Ù‹ Ù…Ø¨Ø§Ø´Ø±Ø§Ù‹)
    if (minRating) {
      const minRatingNum = Number(minRating);
      if (!Number.isFinite(minRatingNum) || minRatingNum < 0 || minRatingNum > 5) {
        return NextResponse.json(
          { status: "error", message: "Ù‚ÙŠÙ…Ø© Ø§Ù„ØªÙ‚ÙŠÙŠÙ… ØºÙŠØ± ØµØ­ÙŠØ­Ø©" },
          { status: 400 }
        );
      }
      products = products.filter((p) => {
        if (p.ratings.length === 0) return false;
        const avg = p.ratings.reduce((sum:  any, r: any) => sum + r.rating, 0) / p.ratings.length;
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

    // Ù†Ø®Ø²Ù‘Ù† Ø§Ù„Ù†ØªÙŠØ¬Ø© Ù„Ù…Ø¯Ø© 60 Ø«Ø§Ù†ÙŠØ© ÙÙ‚Ø· - ÙˆÙ‚Øª ÙƒØ§ÙÙ Ù„ØªØ®ÙÙŠÙ Ø§Ù„Ø¶ØºØ·ØŒ ÙˆÙ‚ØµÙŠØ± ÙƒÙØ§ÙŠØ© Ø­ØªÙ‰ Ù„Ø§ ØªØ¸Ù‡Ø± Ø¨ÙŠØ§Ù†Ø§Øª Ù‚Ø¯ÙŠÙ…Ø© Ø·ÙˆÙŠÙ„Ø§Ù‹
    await setCached(cacheKey, responseBody, 60);

    return NextResponse.json(responseBody);
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { status: "error", message: "ØºÙŠØ± Ù…ØµØ±Ø­ Ù„Ùƒ - Ù‡Ø°Ø§ Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡ Ù„Ù„Ø£Ø¯Ù…Ù† ÙÙ‚Ø·" },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await req.json();

    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { status: "error", message: "Ø¨ÙŠØ§Ù†Ø§Øª ØºÙŠØ± ØµØ­ÙŠØ­Ø©", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const product = await Product.create({ ...parsed.data, ratings: [] });

    // Ù†Ù„ØºÙŠ ÙƒÙ„ ÙƒØ§Ø´ Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ø§Ù„Ù‚Ø¯ÙŠÙ… ÙÙˆØ±Ø§Ù‹ - ÙˆØ¥Ù„Ø§ Ø³ÙŠØ±Ù‰ Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø¨ÙŠØ§Ù†Ø§Øª Ù‚Ø¯ÙŠÙ…Ø© Ù„Ø§ ØªØ´Ù…Ù„ Ù‡Ø°Ø§ Ø§Ù„Ù…Ù†ØªØ¬ Ø§Ù„Ø¬Ø¯ÙŠØ¯ Ù„Ù…Ø¯Ø© Ø¯Ù‚ÙŠÙ‚Ø©
    await bumpCacheVersion("products");

    return NextResponse.json(
      { status: "success", message: "ØªÙ… Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ù…Ù†ØªØ¬ Ø¨Ù†Ø¬Ø§Ø­", product },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


