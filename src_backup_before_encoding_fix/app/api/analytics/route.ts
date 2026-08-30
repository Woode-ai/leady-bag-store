// src/app/api/analytics/route.ts
// GET /api/analytics â†’ Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª Ø´Ø§Ù…Ù„Ø© (Ø£Ø¯Ù…Ù† ÙÙ‚Ø·): Ø¥ÙŠØ±Ø§Ø¯Ø§ØªØŒ Ø£ÙƒØ«Ø± Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ù…Ø¨ÙŠØ¹Ø§Ù‹ØŒ Ø±Ø³Ù… Ø¨ÙŠØ§Ù†ÙŠ Ù„Ù„Ù…Ø¨ÙŠØ¹Ø§Øª Ø§Ù„ÙŠÙˆÙ…ÙŠØ©

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { status: "error", message: "ØºÙŠØ± Ù…ØµØ±Ø­ Ù„Ùƒ - Ù‡Ø°Ø§ Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡ Ù„Ù„Ø£Ø¯Ù…Ù† ÙÙ‚Ø·" },
        { status: 403 }
      );
    }

    await connectDB();

    // 1. Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø¥ÙŠØ±Ø§Ø¯Ø§Øª ÙˆØ¹Ø¯Ø¯ Ø§Ù„Ø·Ù„Ø¨Ø§Øª (ÙÙ‚Ø· Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù…Ø¯ÙÙˆØ¹Ø© ØªÙØ­Ø³Ø¨ ÙƒØ¥ÙŠØ±Ø§Ø¯ ÙØ¹Ù„ÙŠ)
    const paidOrders = await Order.find({ paymentStatus: "paid" });
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = await Order.countDocuments();

    // 2. Ø¹Ø¯Ø¯ Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª ÙˆØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ù†ÙØ§Ø¯ Ø§Ù„Ù…Ø®Ø²ÙˆÙ† (Ø£Ù‚Ù„ Ù…Ù† 5 Ù‚Ø·Ø¹ = ØªÙ†Ø¨ÙŠÙ‡)
    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.find({ stock: { $lt: 5 } }).select(
      "name stock"
    );

    // 3. Ø£ÙƒØ«Ø± 5 Ù…Ù†ØªØ¬Ø§Øª Ù…Ø¨ÙŠØ¹Ø§Ù‹ (Ù†Ø­Ø³Ø¨Ù‡Ø§ Ù…Ù† Ø¹Ù†Ø§ØµØ± ÙƒÙ„ Ø§Ù„Ø·Ù„Ø¨Ø§Øª)
    const allOrders = await Order.find().populate("items.productId", "name");
    const salesCount: Record<string, { name: string; count: number }> = {};

    for (const order of allOrders) {
      for (const item of order.items) {
        const product = item.productId as any;
        if (!product) continue;
        const id = product._id.toString();
        if (!salesCount[id]) {
          salesCount[id] = { name: product.name?.ar || "Ù…Ù†ØªØ¬ Ù…Ø­Ø°ÙˆÙ", count: 0 };
        }
        salesCount[id].count += item.quantity;
      }
    }

    const topProducts = Object.values(salesCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 4. Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª Ø§Ù„ÙŠÙˆÙ…ÙŠØ© Ù„Ø¢Ø®Ø± 7 Ø£ÙŠØ§Ù… (Ù„Ø±Ø³Ù… Ø¨ÙŠØ§Ù†ÙŠ Ø¨Ø³ÙŠØ·)
    const last7Days: { date: string; sales: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayOrders = await Order.find({
        createdAt: { $gte: day, $lt: nextDay },
        paymentStatus: "paid",
      });

      last7Days.push({
        date: day.toISOString().split("T")[0],
        sales: dayOrders.reduce((sum, o) => sum + o.total, 0),
        orders: dayOrders.length,
      });
    }

    return NextResponse.json({
      status: "success",
      analytics: {
        totalRevenue,
        totalOrders,
        totalProducts,
        lowStockProducts,
        topProducts,
        last7Days,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


