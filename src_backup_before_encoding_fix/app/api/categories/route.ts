// src/app/api/categories/route.ts
// GET  /api/categories  â†’ ÙŠØ¹ÙŠØ¯ ÙƒÙ„ Ø§Ù„Ø£Ù‚Ø³Ø§Ù… (Ù…ØªØ§Ø­ Ù„Ù„Ø¬Ù…ÙŠØ¹ØŒ Ø¨Ø¯ÙˆÙ† ØªØ³Ø¬ÙŠÙ„ Ø¯Ø®ÙˆÙ„)
// POST /api/categories  â†’ ÙŠØ¶ÙŠÙ Ù‚Ø³Ù…Ø§Ù‹ Ø¬Ø¯ÙŠØ¯Ø§Ù‹ (Ø£Ø¯Ù…Ù† ÙÙ‚Ø·) - ÙŠÙØ³ØªØ®Ø¯Ù… Ù…Ù† Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import { requireAdmin } from "@/lib/auth";
import { categorySchema } from "@/lib/validation";
import { getCached, setCached, getCacheVersion, bumpCacheVersion } from "@/lib/redis";

export async function GET() {
  try {
    // Ø§Ù„Ø£Ù‚Ø³Ø§Ù… ØªØªØºÙŠÙ‘Ø± Ù†Ø§Ø¯Ø±Ø§Ù‹ Ø¬Ø¯Ø§Ù‹ Ù…Ù‚Ø§Ø±Ù†Ø© Ø¨Ø§Ù„Ù…Ù†ØªØ¬Ø§ØªØŒ ÙÙ†Ø®Ø²Ù‘Ù†Ù‡Ø§ Ù„Ù…Ø¯Ø© Ø£Ø·ÙˆÙ„ (5 Ø¯Ù‚Ø§Ø¦Ù‚)
    const version = await getCacheVersion("categories");
    const cacheKey = `categories:v${version}`;

    const cached = await getCached<any>(cacheKey);
    if (cached) return NextResponse.json(cached);

    await connectDB();
    // ØªØ±ØªÙŠØ¨ Ø§Ù„Ø£Ù‚Ø³Ø§Ù… Ù…Ù† Ø§Ù„Ø£Ø­Ø¯Ø« Ø¥Ù„Ù‰ Ø§Ù„Ø£Ù‚Ø¯Ù…
    const categories = await Category.find().sort({ createdAt: -1 });

    const responseBody = { status: "success", categories };
    await setCached(cacheKey, responseBody, 300);

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
    // ÙÙ‚Ø· Ø§Ù„Ø£Ø¯Ù…Ù† ÙŠÙ…ÙƒÙ†Ù‡ Ø¥Ø¶Ø§ÙØ© Ù‚Ø³Ù… Ø¬Ø¯ÙŠØ¯
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { status: "error", message: "ØºÙŠØ± Ù…ØµØ±Ø­ Ù„Ùƒ - Ù‡Ø°Ø§ Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡ Ù„Ù„Ø£Ø¯Ù…Ù† ÙÙ‚Ø·" },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await req.json();

    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { status: "error", message: "Ø¨ÙŠØ§Ù†Ø§Øª ØºÙŠØ± ØµØ­ÙŠØ­Ø©", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Ø§Ù„ØªØ£ÙƒØ¯ Ø£Ù† Ø§Ù„Ù€ slug ØºÙŠØ± Ù…Ø³ØªØ®Ø¯Ù… Ù…Ù† Ù‚Ø¨Ù„
    const existing = await Category.findOne({ slug: parsed.data.slug });
    if (existing) {
      return NextResponse.json(
        { status: "error", message: "ÙŠÙˆØ¬Ø¯ Ù‚Ø³Ù… Ø¢Ø®Ø± Ø¨Ù†ÙØ³ Ø§Ù„Ù€ slug" },
        { status: 409 }
      );
    }

    const category = await Category.create(parsed.data);
    await bumpCacheVersion("categories");

    return NextResponse.json(
      { status: "success", message: "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù‚Ø³Ù… Ø¨Ù†Ø¬Ø§Ø­", category },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


