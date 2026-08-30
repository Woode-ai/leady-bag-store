// src/app/api/health/route.ts
// Ø±Ø§Ø¨Ø· Ø§Ø®ØªØ¨Ø§Ø± Ø¨Ø³ÙŠØ·: Ø¹Ù†Ø¯ ÙØªØ­Ù‡ ÙÙŠ Ø§Ù„Ù…ØªØµÙØ­ØŒ ÙŠØ­Ø§ÙˆÙ„ Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª
// ÙˆÙŠØ¹ÙŠØ¯ Ø±Ø³Ø§Ù„Ø© ØªÙˆØ¶Ø­ Ù‡Ù„ Ù†Ø¬Ø­ Ø§Ù„Ø§ØªØµØ§Ù„ Ø£Ù… Ù„Ø§
// Ø¬Ø±Ù‘Ø¨Ù‡ Ø¹Ù„Ù‰: http://localhost:3000/api/health

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Category from "@/models/Category";
import Product from "@/models/Product";
import Order from "@/models/Order";
import Cart from "@/models/Cart";
import Coupon from "@/models/Coupon";
import Analytics from "@/models/Analytics";

export async function GET() {
  try {
    await connectDB();

    // Ù†ØªØ£ÙƒØ¯ Ø£Ù† ÙƒÙ„ Ù†Ù…ÙˆØ°Ø¬ (Model) ØªÙ… ØªØ­Ù…ÙŠÙ„Ù‡ Ø¨Ù†Ø¬Ø§Ø­ Ø¨Ø¯ÙˆÙ† Ø£Ø®Ø·Ø§Ø¡
    const modelsLoaded = [
      User.modelName,
      Category.modelName,
      Product.modelName,
      Order.modelName,
      Cart.modelName,
      Coupon.modelName,
      Analytics.modelName,
    ];

    return NextResponse.json({
      status: "success",
      message: "âœ… Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ù†Ø§Ø¬Ø­ ÙˆØ§Ù„Ù†Ù…Ø§Ø°Ø¬ Ø¬Ø§Ù‡Ø²Ø©",
      modelsLoaded,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        status: "error",
        message: "âŒ ÙØ´Ù„ Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª",
        ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }),
      },
      { status: 500 }
    );
  }
}


