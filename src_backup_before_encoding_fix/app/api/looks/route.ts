// src/app/api/looks/route.ts
// GET  /api/looks â†’ Ù‚Ø§Ø¦Ù…Ø© Ø¨ÙƒÙ„ Ø§Ù„Ø¥Ø·Ù„Ø§Ù„Ø§Øª Ø§Ù„Ù…ÙØ¹Ù„Ø© (Ù…ØªØ§Ø­ Ù„Ù„Ø¬Ù…ÙŠØ¹)
// POST /api/looks â†’ Ø¥Ù†Ø´Ø§Ø¡ Ø¥Ø·Ù„Ø§Ù„Ø© Ø¬Ø¯ÙŠØ¯Ø© (Ø£Ø¯Ù…Ù† ÙÙ‚Ø·)

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

    // Ø­Ø³Ø§Ø¨ Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø£Ø³Ø¹Ø§Ø± Ø§Ù„Ø£ØµÙ„ÙŠØ© Ù„ÙƒÙ„ Ø¥Ø·Ù„Ø§Ù„Ø© Ù„Ø¥Ø¸Ù‡Ø§Ø± Ø§Ù„ØªÙˆÙÙŠØ±
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
    const { title, slug, description, imageUrl, bundlePrice, products, isActive } = body;

    if (!title?.ar || !title?.en || !slug || !imageUrl || bundlePrice === undefined) {
      return NextResponse.json(
        { status: "error", message: "ÙŠØ±Ø¬Ù‰ ØªØ¹Ø¨Ø¦Ø© ÙƒØ§ÙØ© Ø§Ù„Ø­Ù‚ÙˆÙ„ Ø§Ù„Ø¥Ù„Ø²Ø§Ù…ÙŠØ© Ù„Ù„Ø¥Ø·Ù„Ø§Ù„Ø©" },
        { status: 400 }
      );
    }

    const cleanSlug = slug.toLowerCase().replace(/\s+/g, "-");
    const existing = await Look.findOne({ slug: cleanSlug });
    if (existing) {
      return NextResponse.json(
        { status: "error", message: "ÙŠÙˆØ¬Ø¯ Ø¥Ø·Ù„Ø§Ù„Ø© Ø£Ø®Ø±Ù‰ Ø¨Ù†ÙØ³ Ø§Ù„Ø±Ø§Ø¨Ø· (Slug)" },
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
      { status: "success", message: "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø¥Ø·Ù„Ø§Ù„Ø© Ø¨Ù†Ø¬Ø§Ø­", look },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


