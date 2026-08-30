// src/app/api/analytics/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/auth";

const VALID_PAYMENT_STATUSES = ["paid", "verified", "cod"];

function isValidSalesOrder(order: any) {
  if (!VALID_PAYMENT_STATUSES.includes(order.paymentStatus)) {
    return false;
  }

  if (order.status === "cancelled" || order.status === "returned") {
    return false;
  }

  if (
    order.returnStatus === "approved"
  ) {
    return false;
  }

  return true;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);

    if (!admin) {
      return NextResponse.json(
        {
          status: "error",
          message: "غير مصرح لك - هذا الإجراء للأدمن فقط",
        },
        { status: 403 }
      );
    }

    await connectDB();

    // =========================================================
    // جلب البيانات
    // =========================================================

    const [allOrders, allProducts] = await Promise.all([
      Order.find()
        .populate("items.productId", "name costPrice price")
        .sort({ createdAt: -1 })
        .lean(),

      Product.find()
        .select("name stock costPrice price")
        .lean(),
    ]);

    // =========================================================
    // الطلبات التي تعتبر مبيعات فعلية
    //
    // paid      = مدفوع
    // verified  = تم التحقق من التحويل البنكي
    // cod       = دفع عند الاستلام
    //
    // نستبعد:
    // cancelled
    // returned
    // refund approved
    // =========================================================

    const salesOrders = allOrders.filter(isValidSalesOrder);

    // =========================================================
    // الإحصائيات الأساسية
    // =========================================================

    let totalRevenue = 0;
    let totalCost = 0;
    let totalItemsSold = 0;

    const salesCount: Record<
      string,
      {
        name: string;
        count: number;
        revenue: number;
        cost: number;
        profit: number;
      }
    > = {};

    for (const order of salesOrders) {
      const orderTotal = Number(order.total) || 0;

      totalRevenue += orderTotal;

      for (const item of order.items || []) {
        const product = item.productId as any;

        const quantity = Number(item.quantity) || 0;
        const sellingPrice = Number(item.price) || 0;
        const costPrice = Number(product?.costPrice) || 0;

        const itemRevenue = sellingPrice * quantity;
        const itemCost = costPrice * quantity;

        totalCost += itemCost;
        totalItemsSold += quantity;

        if (product?._id) {
          const id = product._id.toString();

          if (!salesCount[id]) {
            salesCount[id] = {
              name:
                product.name?.ar ||
                product.name?.en ||
                "منتج محذوف",

              count: 0,
              revenue: 0,
              cost: 0,
              profit: 0,
            };
          }

          salesCount[id].count += quantity;
          salesCount[id].revenue += itemRevenue;
          salesCount[id].cost += itemCost;
          salesCount[id].profit += itemRevenue - itemCost;
        }
      }
    }

    // =========================================================
    // الربح
    //
    // نستخدم:
    // المبيعات - تكلفة المنتجات
    //
    // الخصومات موجودة بالفعل في order.total
    // لذلك لا نطرحها مرة أخرى.
    // =========================================================

    const totalProfit = totalRevenue - totalCost;

    const profitMargin =
      totalRevenue > 0
        ? (totalProfit / totalRevenue) * 100
        : 0;

    // =========================================================
    // إجمالي الخصومات
    // =========================================================

    const totalDiscount = salesOrders.reduce(
      (sum, order) => sum + (Number(order.discount) || 0),
      0
    );

    // =========================================================
    // عدد المنتجات
    // =========================================================

    const totalProducts = allProducts.length;

    // =========================================================
    // المخزون المنخفض
    // =========================================================

    const lowStockProducts = allProducts
      .filter((product) => Number(product.stock) < 5)
      .map((product) => ({
        _id: product._id,
        name: product.name,
        stock: product.stock,
        costPrice: product.costPrice || 0,
      }));

    // =========================================================
    // أكثر المنتجات مبيعاً
    // =========================================================

    const topProducts = Object.values(salesCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((product) => ({
        ...product,
        revenue: roundMoney(product.revenue),
        cost: roundMoney(product.cost),
        profit: roundMoney(product.profit),
      }));

    // =========================================================
    // آخر 7 أيام
    // =========================================================

    const last7Days: {
      date: string;
      sales: number;
      cost: number;
      profit: number;
      orders: number;
      items: number;
    }[] = [];

    for (let i = 6; i >= 0; i--) {
      const day = new Date();

      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);

      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayOrders = salesOrders.filter((order: any) => {
        const createdAt = new Date(order.createdAt);

        return (
          createdAt >= day &&
          createdAt < nextDay
        );
      });

      let daySales = 0;
      let dayCost = 0;
      let dayItems = 0;

      for (const order of dayOrders) {
        daySales += Number(order.total) || 0;

        for (const item of order.items || []) {
          const product = item.productId as any;

          const quantity = Number(item.quantity) || 0;
          const costPrice =
            Number(product?.costPrice) || 0;

          dayCost += costPrice * quantity;
          dayItems += quantity;
        }
      }

      last7Days.push({
        date: day.toISOString().split("T")[0],

        sales: roundMoney(daySales),

        cost: roundMoney(dayCost),

        profit: roundMoney(
          daySales - dayCost
        ),

        orders: dayOrders.length,

        items: dayItems,
      });
    }

    // =========================================================
    // إحصائيات إضافية
    // =========================================================

    const pendingOrders = allOrders.filter(
      (order: any) =>
        !isValidSalesOrder(order) &&
        order.status !== "cancelled" &&
        order.status !== "returned"
    ).length;

    const cancelledOrders = allOrders.filter(
      (order: any) =>
        order.status === "cancelled"
    ).length;

    const returnedOrders = allOrders.filter(
      (order: any) =>
        order.status === "returned" ||
        order.returnStatus === "approved"
    ).length;

    const averageOrderValue =
      salesOrders.length > 0
        ? totalRevenue / salesOrders.length
        : 0;

    // =========================================================
    // التحقق من المنتجات التي لا تحتوي سعر شراء
    // =========================================================

    const productsWithoutCost = allProducts.filter(
      (product) =>
        !Number(product.costPrice) ||
        Number(product.costPrice) <= 0
    ).length;

    // =========================================================
    // الاستجابة
    // =========================================================

    return NextResponse.json({
      status: "success",

      analytics: {
        // الأساسية
        totalRevenue: roundMoney(totalRevenue),
        totalCost: roundMoney(totalCost),
        totalProfit: roundMoney(totalProfit),

        profitMargin: roundMoney(profitMargin),

        totalOrders: salesOrders.length,

        totalItemsSold,

        totalProducts,

        totalDiscount: roundMoney(totalDiscount),

        averageOrderValue: roundMoney(
          averageOrderValue
        ),

        // حالات الطلبات
        pendingOrders,

        cancelledOrders,

        returnedOrders,

        // المنتجات
        productsWithoutCost,

        lowStockProducts,

        topProducts,

        // الرسم البياني
        last7Days,
      },
    });
  } catch (error: unknown) {
    console.error("Analytics error:", error);

    return NextResponse.json(
      {
        status: "error",

        message:
          "حدث خطأ أثناء تحميل الإحصائيات",

        ...(process.env.NODE_ENV !== "production" && {
          error:
            error instanceof Error
              ? error.message
              : String(error),
        }),
      },
      { status: 500 }
    );
  }
}