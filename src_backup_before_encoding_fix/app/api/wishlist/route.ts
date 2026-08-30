// src/app/api/wishlist/route.ts
// GET    /api/wishlist â†’ Ø¹Ø±Ø¶ Ù‚Ø§Ø¦Ù…Ø© Ø£Ù…Ù†ÙŠØ§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø§Ù„Ø­Ø§Ù„ÙŠ (Ù…Ø¹ ØªÙØ§ØµÙŠÙ„ ÙƒÙ„ Ù…Ù†ØªØ¬)
// POST   /api/wishlist â†’ Ø¥Ø¶Ø§ÙØ© Ù…Ù†ØªØ¬ Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø£Ù…Ù†ÙŠØ§Øª
// DELETE /api/wishlist?productId=xxx â†’ Ø¥Ø²Ø§Ù„Ø© Ù…Ù†ØªØ¬ Ù…Ù† Ø§Ù„Ù‚Ø§Ø¦Ù…Ø©

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const currentUser = getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json(
        { status: "error", message: "ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„" },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findById(currentUser.userId).populate(
      "wishlist",
      "name price discountPrice images stock ratings"
    );

    return NextResponse.json({ status: "success", wishlist: user?.wishlist || [] });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json(
        { status: "error", message: "ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„" },
        { status: 401 }
      );
    }

    await connectDB();
    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json(
        { status: "error", message: "ÙŠØ¬Ø¨ ØªØ­Ø¯ÙŠØ¯ productId" },
        { status: 400 }
      );
    }

    // $addToSet ÙŠÙ…Ù†Ø¹ ØªÙƒØ±Ø§Ø± Ù†ÙØ³ Ø§Ù„Ù…Ù†ØªØ¬ Ù…Ø±ØªÙŠÙ† ÙÙŠ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø©
    await User.findByIdAndUpdate(currentUser.userId, {
      $addToSet: { wishlist: productId },
    });

    return NextResponse.json({ status: "success", message: "ØªÙ…Øª Ø§Ù„Ø¥Ø¶Ø§ÙØ© Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø£Ù…Ù†ÙŠØ§Øª" });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const currentUser = getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json(
        { status: "error", message: "ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    if (!productId) {
      return NextResponse.json(
        { status: "error", message: "ÙŠØ¬Ø¨ ØªØ­Ø¯ÙŠØ¯ productId" },
        { status: 400 }
      );
    }

    await connectDB();
    await User.findByIdAndUpdate(currentUser.userId, {
      $pull: { wishlist: productId },
    });

    return NextResponse.json({ status: "success", message: "ØªÙ…Øª Ø§Ù„Ø¥Ø²Ø§Ù„Ø© Ù…Ù† Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø£Ù…Ù†ÙŠØ§Øª" });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


