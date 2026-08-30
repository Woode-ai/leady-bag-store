// src/app/api/cart/route.ts
// GET   /api/cart  â†’ Ø¹Ø±Ø¶ Ø³Ù„Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø§Ù„Ø­Ø§Ù„ÙŠ (Ù…Ø¹ ØªÙØ§ØµÙŠÙ„ ÙƒÙ„ Ù…Ù†ØªØ¬)
// POST  /api/cart  â†’ Ø¥Ø¶Ø§ÙØ© Ù…Ù†ØªØ¬ Ù„Ù„Ø³Ù„Ø© (Ø£Ùˆ Ø²ÙŠØ§Ø¯Ø© ÙƒÙ…ÙŠØªÙ‡ Ø¥Ø°Ø§ ÙƒØ§Ù† Ù…ÙˆØ¬ÙˆØ¯Ø§Ù‹ Ø¨Ø§Ù„ÙØ¹Ù„)
// PUT   /api/cart  â†’ ØªØ­Ø¯ÙŠØ« ÙƒÙ…ÙŠØ© Ù…Ù†ØªØ¬ Ù…Ø¹ÙŠÙ† ÙÙŠ Ø§Ù„Ø³Ù„Ø©
// DELETE /api/cart?productId=xxx â†’ Ø­Ø°Ù Ù…Ù†ØªØ¬ Ù…Ù† Ø§Ù„Ø³Ù„Ø©

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Cart from "@/models/Cart";
import { getCurrentUser } from "@/lib/auth";
import { cartItemSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const currentUser = getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json(
        { status: "error", message: "ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù„Ø¹Ø±Ø¶ Ø§Ù„Ø³Ù„Ø©" },
        { status: 401 }
      );
    }

    await connectDB();
    let cart = await Cart.findOne({ userId: currentUser.userId }).populate(
      "items.productId",
      "name price discountPrice images stock"
    );

    // Ø¥Ø°Ø§ Ù„Ù… ÙŠÙƒÙ† Ù„Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø³Ù„Ø© Ø¨Ø¹Ø¯ØŒ Ù†Ù†Ø´Ø¦ Ù„Ù‡ ÙˆØ§Ø­Ø¯Ø© ÙØ§Ø±ØºØ© ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹
    if (!cart) {
      cart = await Cart.create({ userId: currentUser.userId, items: [] });
    }

    let couponData = null;
    if (cart.couponCode) {
      const Coupon = (await import("@/models/Coupon")).default;
      const foundCoupon = await Coupon.findOne({ code: cart.couponCode.toUpperCase() });
      if (foundCoupon) {
        const now = new Date();
        if (now >= foundCoupon.startDate && now <= foundCoupon.endDate && foundCoupon.usedCount < foundCoupon.usageLimit) {
          couponData = {
            code: foundCoupon.code,
            discountType: foundCoupon.discountType,
            value: foundCoupon.value,
          };
        }
      }
    }

    return NextResponse.json({ status: "success", cart, coupon: couponData });
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
        { status: "error", message: "ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù„Ø¥Ø¶Ø§ÙØ© Ù…Ù†ØªØ¬ Ù„Ù„Ø³Ù„Ø©" },
        { status: 401 }
      );
    }

    await connectDB();
    const body = await req.json();

    const parsed = cartItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { status: "error", message: "Ø¨ÙŠØ§Ù†Ø§Øª ØºÙŠØ± ØµØ­ÙŠØ­Ø©", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { productId, quantity } = parsed.data;

    let cart = await Cart.findOne({ userId: currentUser.userId });
    if (!cart) {
      cart = new Cart({ userId: currentUser.userId, items: [] });
    }

    // Ø¥Ø°Ø§ ÙƒØ§Ù† Ø§Ù„Ù…Ù†ØªØ¬ Ù…ÙˆØ¬ÙˆØ¯Ø§Ù‹ Ø¨Ø§Ù„ÙØ¹Ù„ ÙÙŠ Ø§Ù„Ø³Ù„Ø©ØŒ Ù†Ø²ÙŠØ¯ ÙƒÙ…ÙŠØªÙ‡ Ø¨Ø¯Ù„Ø§Ù‹ Ù…Ù† ØªÙƒØ±Ø§Ø±Ù‡
    const existingItem = cart.items.find((item: any) => item.productId.toString() === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId: productId as any, quantity });
    }

    await cart.save();
    await cart.populate("items.productId", "name price discountPrice images stock");

    return NextResponse.json({ status: "success", message: "ØªÙ…Øª Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ù…Ù†ØªØ¬ Ù„Ù„Ø³Ù„Ø©", cart });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const currentUser = getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json(
        { status: "error", message: "ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„" },
        { status: 401 }
      );
    }

    await connectDB();
    const body = await req.json();
    const parsed = cartItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { status: "error", message: "Ø¨ÙŠØ§Ù†Ø§Øª ØºÙŠØ± ØµØ­ÙŠØ­Ø©", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { productId, quantity } = parsed.data;

    const cart = await Cart.findOne({ userId: currentUser.userId });
    if (!cart) {
      return NextResponse.json({ status: "error", message: "Ø§Ù„Ø³Ù„Ø© ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯Ø©" }, { status: 404 });
    }

    const item = cart.items.find((i : any) => i.productId.toString() === productId);
    if (!item) {
      return NextResponse.json(
        { status: "error", message: "Ù‡Ø°Ø§ Ø§Ù„Ù…Ù†ØªØ¬ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯ ÙÙŠ Ø§Ù„Ø³Ù„Ø©" },
        { status: 404 }
      );
    }

    item.quantity = quantity;
    await cart.save();
    await cart.populate("items.productId", "name price discountPrice images stock");

    return NextResponse.json({ status: "success", message: "ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„ÙƒÙ…ÙŠØ©", cart });
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
    const cart = await Cart.findOne({ userId: currentUser.userId });
    if (!cart) {
      return NextResponse.json({ status: "error", message: "Ø§Ù„Ø³Ù„Ø© ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯Ø©" }, { status: 404 });
    }

    cart.items = cart.items.filter((i : any) => i.productId.toString() !== productId);
    await cart.save();

    return NextResponse.json({ status: "success", message: "ØªÙ… Ø­Ø°Ù Ø§Ù„Ù…Ù†ØªØ¬ Ù…Ù† Ø§Ù„Ø³Ù„Ø©", cart });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


