import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import Cart from "@/models/Cart";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Coupon from "@/models/Coupon";
import User from "@/models/User";
import PaymentMethod from "@/models/PaymentMethod";
import Settings from "@/models/Settings";
import { getCurrentUser } from "@/lib/auth";
import { createOrderSchema } from "@/lib/validation";
import { sendOrderConfirmationEmail } from "@/lib/mailer";

function makeTrackingNumber() {
  return `LB-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  const currentUser = getCurrentUser(req);
  if (!currentUser) {
    return NextResponse.json(
      { status: "error", message: "ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù„Ø¥ØªÙ…Ø§Ù… Ø§Ù„Ø·Ù„Ø¨" },
      { status: 401 }
    );
  }

  let dbSession: any = null;

  try {
    await connectDB();

    const rawBody = await req.json();
    const parsed = createOrderSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          status: "error",
          message: "Ø¨ÙŠØ§Ù†Ø§Øª ØºÙŠØ± ØµØ­ÙŠØ­Ø©",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { shippingAddress, paymentMethodId, useLoyaltyPoints } = parsed.data;

    dbSession = await Product.startSession();
    let createdOrder: any = null;
    let buyerForEmail: any = null;

    await dbSession.withTransaction(async () => {
      const selectedPaymentMethod = await PaymentMethod.findOne({
        _id: paymentMethodId,
        isActive: true,
      }).session(dbSession);

      if (!selectedPaymentMethod) {
        throw new Error("PAYMENT_METHOD_UNAVAILABLE");
      }

      const cart = await Cart.findOne({
        userId: currentUser.userId,
      })
        .populate("items.productId")
        .session(dbSession);

      if (!cart || cart.items.length === 0) {
        throw new Error("EMPTY_CART");
      }

      const buyer = await User.findById(currentUser.userId).session(dbSession);
      if (!buyer) throw new Error("USER_NOT_FOUND");
      buyerForEmail = buyer;

      // Validate the coupon before changing stock or user balances.
      let couponDiscount = 0;
      let couponToUse: any = null;

      if (cart.couponCode) {
        couponToUse = await Coupon.findOne({
          code: cart.couponCode.toUpperCase(),
          startDate: { $lte: new Date() },
          endDate: { $gte: new Date() },
          $expr: { $lt: ["$usedCount", "$usageLimit"] },
        }).session(dbSession);

        if (!couponToUse) throw new Error("INVALID_COUPON");
      }

      let subtotal = 0;
      const orderItems: any[] = [];

      for (const item of cart.items as any[]) {
        const product = item.productId;

        if (!product || product.stock < item.quantity) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        const priceToUse =
          product.discountPrice !== undefined &&
          product.discountPrice !== null &&
          product.discountPrice < product.price
            ? product.discountPrice
            : product.price;

        subtotal += priceToUse * item.quantity;
        orderItems.push({
          productId: product._id,
          quantity: item.quantity,
          price: priceToUse,
        });
      }

      if (couponToUse) {
        couponDiscount =
          couponToUse.discountType === "percentage"
            ? (subtotal * couponToUse.value) / 100
            : couponToUse.value;
        couponDiscount = Math.min(couponDiscount, subtotal);
      }

      const settings = await Settings.findOne().session(dbSession);
      const pointValue = Math.max(
        0,
        Number(settings?.currencyValuePerPoint ?? 10)
      );

      let loyaltyDiscount = 0;
      let pointsUsed = 0;

      if (useLoyaltyPoints && pointValue > 0 && buyer.loyaltyPoints > 0) {
        const maximumDiscount = Math.max(0, subtotal - couponDiscount);
        const maximumByPoints = buyer.loyaltyPoints * pointValue;
        loyaltyDiscount = Math.min(maximumDiscount, maximumByPoints);
        pointsUsed = Math.min(
          buyer.loyaltyPoints,
          Math.ceil(loyaltyDiscount / pointValue)
        );
        loyaltyDiscount = Math.min(loyaltyDiscount, pointsUsed * pointValue);
      }

      const totalDiscount = Math.min(
        subtotal,
        couponDiscount + loyaltyDiscount
      );
      const finalTotal = Math.max(0, subtotal - totalDiscount);

      // Reserve stock atomically inside the transaction.
      for (const item of orderItems) {
        const updated = await Product.updateOne(
          {
            _id: item.productId,
            stock: { $gte: item.quantity },
          },
          { $inc: { stock: -item.quantity } },
          { session: dbSession }
        );

        if (updated.modifiedCount !== 1) {
          throw new Error("INSUFFICIENT_STOCK");
        }
      }

      if (couponToUse) {
        const couponUpdate = await Coupon.updateOne(
          {
            _id: couponToUse._id,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() },
            $expr: { $lt: ["$usedCount", "$usageLimit"] },
          },
          { $inc: { usedCount: 1 } },
          { session: dbSession }
        );

        if (couponUpdate.modifiedCount !== 1) {
          throw new Error("COUPON_LIMIT_REACHED");
        }
      }

      if (pointsUsed > 0) {
        const pointsUpdate = await User.updateOne(
          {
            _id: buyer._id,
            loyaltyPoints: { $gte: pointsUsed },
          },
          { $inc: { loyaltyPoints: -pointsUsed } },
          { session: dbSession }
        );

        if (pointsUpdate.modifiedCount !== 1) {
          throw new Error("LOYALTY_BALANCE_CHANGED");
        }
      }

      const paymentStatus =
        selectedPaymentMethod.type === "cod"
          ? "cod"
          : selectedPaymentMethod.type === "bank_transfer"
            ? "pending_verification"
            : "pending";

      const created = await Order.create(
        [
          {
            userId: currentUser.userId,
            items: orderItems,
            total: finalTotal,
            discount: totalDiscount,
            coupon: couponToUse?.code,
            status: "pending",
            shippingAddress,
            paymentMethod: {
              methodId: selectedPaymentMethod._id,
              name: selectedPaymentMethod.name,
              type: selectedPaymentMethod.type,
              instructions: selectedPaymentMethod.instructions,
            },
            paymentStatus,
            loyaltyPointsUsed: pointsUsed,
            loyaltyDiscount,
            trackingNumber: makeTrackingNumber(),
          },
        ],
        { session: dbSession }
      );

      createdOrder = created[0];

      await Cart.updateOne(
        { _id: cart._id },
        { $set: { items: [] }, $unset: { couponCode: "" } },
        { session: dbSession }
      );
    });

    const order = await Order.findById(createdOrder._id);

    // Non-critical integrations happen only after the transaction commits.
    void (async () => {
      try {
        if (buyerForEmail) {
          await sendOrderConfirmationEmail(
            buyerForEmail.email,
            buyerForEmail.name,
            order.trackingNumber!,
            order.total
          );
        }
      } catch (error) {
        console.error("Order email failed:", error);
      }

      try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (botToken && chatId) {
          const itemsText = order.items
            .map(
              (item: any) =>
                `â–ªï¸ Product (qty: ${item.quantity}) - ${item.price} SDG`
            )
            .join("\n");

            
            const message = 
  `🚨 *طلب جديد في متجر Leadybag!*\n\n` +
  `📦 *رقم الطلب:* #${order.trackingNumber}\n` +
  `👤 *اسم العميل:* ${buyerForEmail?.name || "Customer"}\n` +
  `📍 *العنوان:* ${order.shippingAddress}\n\n` +
  `🛒 *المنتجات المطلوبة:*\n${itemsText}\n\n` +
  `💰 *الإجمالي الكلي:* ${order.total} SDG`;
        /*  const message =
            `ðŸš¨ *New Leadybag order*\n\n` +
            `ðŸ“¦ *Tracking:* #${order.trackingNumber}\n` +
            `ðŸ‘¤ *Customer:* ${buyerForEmail?.name || "Customer"}\n` +
            `ðŸ“ *Address:* ${order.shippingAddress}\n\n` +
            `ðŸ›’ *Items:*\n${itemsText}\n\n` +
            `ðŸ’° *Total:* ${order.total} SDG`;
*/
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
              parse_mode: "Markdown",
            }),
          });
        }
      } catch (error) {
        console.error("Telegram notification failed:", error);
      }
    })();

    return NextResponse.json(
      {
        status: "success",
        message: "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø·Ù„Ø¨ Ø¨Ù†Ø¬Ø§Ø­",
        order,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const messages: Record<string, [string, number]> = {
      PAYMENT_METHOD_UNAVAILABLE: ["Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø¯ÙØ¹ Ø§Ù„Ù…Ø®ØªØ§Ø±Ø© ØºÙŠØ± Ù…ØªØ§Ø­Ø© Ø­Ø§Ù„ÙŠØ§Ù‹", 400],
      EMPTY_CART: ["Ø§Ù„Ø³Ù„Ø© ÙØ§Ø±ØºØ©ØŒ Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø¥ØªÙ…Ø§Ù… Ø§Ù„Ø·Ù„Ø¨", 400],
      USER_NOT_FOUND: ["Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯", 401],
      INVALID_COUPON: ["Ø§Ù„ÙƒÙˆØ¨ÙˆÙ† ØºÙŠØ± ØµØ§Ù„Ø­ Ø£Ùˆ Ø§Ù†ØªÙ‡Øª ØµÙ„Ø§Ø­ÙŠØªÙ‡", 400],
      INSUFFICIENT_STOCK: ["Ø¨Ø¹Ø¶ Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ù„Ù… ØªØ¹Ø¯ Ù…ØªÙˆÙØ±Ø© Ø¨Ø§Ù„ÙƒÙ…ÙŠØ© Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©", 409],
      COUPON_LIMIT_REACHED: ["ØªÙ… Ø§Ø³ØªÙ†ÙØ§Ø¯ Ø¹Ø¯Ø¯ Ø§Ø³ØªØ®Ø¯Ø§Ù…Ø§Øª Ø§Ù„ÙƒÙˆØ¨ÙˆÙ† Ø£Ø«Ù†Ø§Ø¡ Ø¥ØªÙ…Ø§Ù… Ø§Ù„Ø·Ù„Ø¨", 409],
      LOYALTY_BALANCE_CHANGED: ["ØªØºÙŠØ± Ø±ØµÙŠØ¯ Ù†Ù‚Ø§Ø· Ø§Ù„ÙˆÙ„Ø§Ø¡ØŒ Ø­Ø§ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰", 409],
    };

    const [message, status] = messages[error instanceof Error ? error.message : String(error)] || [
      "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±",
      500,
    ];

    return NextResponse.json({ status: "error", message }, { status });
  } finally {
    if (dbSession) await dbSession.endSession();
  }
}

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

    const filter =
      currentUser.role === "admin"
        ? {}
        : { userId: currentUser.userId };

    const orders = await Order.find(filter)
      .populate("items.productId", "name images")
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({ status: "success", orders });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±" },
      { status: 500 }
    );
  }
}


