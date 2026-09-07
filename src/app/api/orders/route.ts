// src/app/api/orders/route.ts

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createOrderSchema } from "@/lib/validation";
import { sendOrderConfirmationEmail } from "@/lib/mailer";

import Cart from "@/models/Cart";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Coupon from "@/models/Coupon";
import User from "@/models/User";
import PaymentMethod from "@/models/PaymentMethod";
import Settings from "@/models/Settings";

/**
 * إنشاء رقم تتبع فريد للطلب.
 */
function makeTrackingNumber(): string {
  return `LB-${Date.now()
    .toString(36)
    .toUpperCase()}-${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;
}

/**
 * تحويل القيمة إلى رقم موجب.
 */
function positiveNumber(
  value: unknown,
  fallback: number
): number {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0
    ? number
    : fallback;
}

/**
 * POST /api/orders
 *
 * إنشاء طلب جديد.
 */
export async function POST(req: NextRequest) {
  /**
   * يجب أن يكون العميل مسجل الدخول.
   */
  const currentUser = getCurrentUser(req);

  if (!currentUser) {
    return NextResponse.json(
      {
        status: "error",
        message: "يجب تسجيل الدخول لإتمام الطلب",
      },
      {
        status: 401,
      }
    );
  }

  let session: any = null;

  try {
    await connectDB();

    /**
     * قراءة Body.
     */
    const rawBody = await req.json();

    /**
     * التحقق من البيانات.
     */
    const parsed = createOrderSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          status: "error",
          message: "بيانات الطلب غير صحيحة",
          errors: parsed.error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    const {
      shippingAddress,
      paymentMethodId,
      useLoyaltyPoints,
    } = parsed.data;

    /**
     * نستخدم Session من MongoDB.
     *
     * Product.startSession() يعمل لأن Product هو Mongoose Model،
     * لكن استخدام mongoose.startSession() أكثر وضوحًا.
     *
     * لتجنب إضافة import آخر، نستعمل Model.startSession().
     */
    session = await Product.startSession();

    let createdOrder: any = null;
    let buyerForEmail: any = null;

    await session.withTransaction(async () => {
      /**
       * ==========================================================
       * 1. طريقة الدفع
       * ==========================================================
       */

      const selectedPaymentMethod =
        await PaymentMethod.findOne({
          _id: paymentMethodId,
          isActive: true,
        }).session(session);

      if (!selectedPaymentMethod) {
        throw new Error("PAYMENT_METHOD_UNAVAILABLE");
      }

      /**
       * ==========================================================
       * 2. السلة
       * ==========================================================
       */

      const cart = await Cart.findOne({
        userId: currentUser.userId,
      })
        .populate("items.productId")
        .session(session);

      if (!cart || cart.items.length === 0) {
        throw new Error("EMPTY_CART");
      }

      /**
       * ==========================================================
       * 3. المستخدم
       * ==========================================================
       */

      const buyer = await User.findById(
        currentUser.userId
      ).session(session);

      if (!buyer) {
        throw new Error("USER_NOT_FOUND");
      }

      buyerForEmail = buyer;

      /**
       * ==========================================================
       * 4. الكوبون
       * ==========================================================
       */

      let couponDiscount = 0;
      let couponToUse: any = null;

      if (cart.couponCode) {
        couponToUse = await Coupon.findOne({
          code: String(cart.couponCode).toUpperCase(),

          startDate: {
            $lte: new Date(),
          },

          endDate: {
            $gte: new Date(),
          },

          $expr: {
            $lt: ["$usedCount", "$usageLimit"],
          },
        }).session(session);

        if (!couponToUse) {
          throw new Error("INVALID_COUPON");
        }
      }

      /**
       * ==========================================================
       * 5. حساب المنتجات
       * ==========================================================
       */

      let subtotal = 0;

      const orderItems: Array<{
        productId: any;
        quantity: number;
        price: number;
      }> = [];

      for (const item of cart.items as any[]) {
        const product = item.productId;

        if (!product) {
          throw new Error("PRODUCT_NOT_FOUND");
        }

        const quantity = Number(item.quantity);

        if (
          !Number.isInteger(quantity) ||
          quantity <= 0
        ) {
          throw new Error("INVALID_QUANTITY");
        }

        /**
         * التأكد من المخزون.
         */
        if (product.stock < quantity) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        /**
         * اختيار السعر:
         *
         * إذا كان discountPrice صالحًا وأقل من السعر الأصلي،
         * نستخدم السعر المخفض.
         */
        const hasDiscount =
          product.discountPrice !== undefined &&
          product.discountPrice !== null &&
          Number(product.discountPrice) <
            Number(product.price);

        const priceToUse = hasDiscount
          ? Number(product.discountPrice)
          : Number(product.price);

        if (
          !Number.isFinite(priceToUse) ||
          priceToUse < 0
        ) {
          throw new Error("INVALID_PRODUCT_PRICE");
        }

        subtotal += priceToUse * quantity;

        orderItems.push({
          productId: product._id,
          quantity,
          price: priceToUse,
        });
      }

      /**
       * ==========================================================
       * 6. حساب خصم الكوبون
       * ==========================================================
       */

      if (couponToUse) {
        if (
          couponToUse.discountType ===
          "percentage"
        ) {
          couponDiscount =
            (subtotal *
              Number(couponToUse.value)) /
            100;
        } else {
          couponDiscount = Number(
            couponToUse.value
          );
        }

        couponDiscount = Math.min(
          Math.max(0, couponDiscount),
          subtotal
        );
      }

      /**
       * ==========================================================
       * 7. إعدادات نقاط الولاء
       * ==========================================================
       */

      const settings =
        await Settings.findOne().session(session);

      /**
       * قيمة النقطة الواحدة.
       *
       * إذا لم تكن موجودة نستخدم 10.
       */
      const pointValue = positiveNumber(
        settings?.currencyValuePerPoint,
        10
      );

      /**
       * أقل عدد نقاط يمكن استخدامه.
       */
      const minPointsToRedeem = Math.max(
        1,
        Math.floor(
          positiveNumber(
            settings?.minPointsToRedeem,
            10
          )
        )
      );

      /**
       * ==========================================================
       * 8. حساب خصم نقاط الولاء
       * ==========================================================
       */

      let loyaltyDiscount = 0;
      let pointsUsed = 0;

      const availablePoints = Math.max(
        0,
        Math.floor(
          Number(buyer.loyaltyPoints || 0)
        )
      );

      if (
        useLoyaltyPoints &&
        pointValue > 0 &&
        availablePoints >=
          minPointsToRedeem
      ) {
        /**
         * أقصى مبلغ متاح بعد خصم الكوبون.
         */
        const maximumDiscount = Math.max(
          0,
          subtotal - couponDiscount
        );

        /**
         * القيمة المالية لجميع النقاط.
         */
        const maximumByPoints =
          availablePoints * pointValue;

        /**
         * لا نسمح للنقاط بتجاوز المبلغ المتبقي.
         */
        loyaltyDiscount = Math.min(
          maximumDiscount,
          maximumByPoints
        );

        /**
         * حساب عدد النقاط الفعلي المستخدم.
         */
        pointsUsed = Math.min(
          availablePoints,
          Math.ceil(
            loyaltyDiscount / pointValue
          )
        );

        /**
         * إعادة ضبط الخصم بناءً على النقاط الفعلية.
         */
        loyaltyDiscount = Math.min(
          loyaltyDiscount,
          pointsUsed * pointValue
        );
      }

      /**
       * ==========================================================
       * 9. الإجمالي النهائي
       * ==========================================================
       */

      const totalDiscount = Math.min(
        subtotal,
        couponDiscount +
          loyaltyDiscount
      );

      const finalTotal = Math.max(
        0,
        subtotal - totalDiscount
      );

      /**
       * ==========================================================
       * 10. حجز المخزون
       * ==========================================================
       *
       * يتم التحديث بشرط stock >= quantity
       * لمنع بيع كمية غير موجودة في حالة طلبين متزامنين.
       */

      for (const item of orderItems) {
        const updated =
          await Product.updateOne(
            {
              _id: item.productId,

              stock: {
                $gte: item.quantity,
              },
            },
            {
              $inc: {
                stock: -item.quantity,
              },
            },
            {
              session,
            }
          );

        if (updated.modifiedCount !== 1) {
          throw new Error(
            "INSUFFICIENT_STOCK"
          );
        }
      }

      /**
       * ==========================================================
       * 11. استخدام الكوبون
       * ==========================================================
       */

      if (couponToUse) {
        const couponUpdate =
          await Coupon.updateOne(
            {
              _id: couponToUse._id,

              startDate: {
                $lte: new Date(),
              },

              endDate: {
                $gte: new Date(),
              },

              $expr: {
                $lt: [
                  "$usedCount",
                  "$usageLimit",
                ],
              },
            },
            {
              $inc: {
                usedCount: 1,
              },
            },
            {
              session,
            }
          );

        if (
          couponUpdate.modifiedCount !== 1
        ) {
          throw new Error(
            "COUPON_LIMIT_REACHED"
          );
        }
      }

      /**
       * ==========================================================
       * 12. خصم نقاط الولاء
       * ==========================================================
       */

      if (pointsUsed > 0) {
        const pointsUpdate =
          await User.updateOne(
            {
              _id: buyer._id,

              loyaltyPoints: {
                $gte: pointsUsed,
              },
            },
            {
              $inc: {
                loyaltyPoints: -pointsUsed,
              },
            },
            {
              session,
            }
          );

        if (
          pointsUpdate.modifiedCount !== 1
        ) {
          throw new Error(
            "LOYALTY_BALANCE_CHANGED"
          );
        }
      }

      /**
       * ==========================================================
       * 13. حالة الدفع
       * ==========================================================
       */

      let paymentStatus:
        | "cod"
        | "pending_verification"
        | "pending";

      if (
        selectedPaymentMethod.type ===
        "cod"
      ) {
        paymentStatus = "cod";
      } else if (
        selectedPaymentMethod.type ===
        "bank_transfer"
      ) {
        paymentStatus =
          "pending_verification";
      } else {
        paymentStatus = "pending";
      }

      /**
       * ==========================================================
       * 14. إنشاء الطلب
       * ==========================================================
       */

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
              methodId:
                selectedPaymentMethod._id,

              name:
                selectedPaymentMethod.name,

              type:
                selectedPaymentMethod.type,

              instructions:
                selectedPaymentMethod.instructions,
            },

            paymentStatus,

            loyaltyPointsUsed:
              pointsUsed,

            loyaltyDiscount,

            /**
             * يستخدم لاحقًا عند إتمام الطلب
             * لمنع إضافة نقاط الولاء أكثر من مرة.
             */
            loyaltyPointsAwarded: false,

            trackingNumber:
              makeTrackingNumber(),
          },
        ],
        {
          session,
        }
      );

      createdOrder = created[0];

      /**
       * ==========================================================
       * 15. تفريغ السلة
       * ==========================================================
       */

      await Cart.updateOne(
        {
          _id: cart._id,
        },
        {
          $set: {
            items: [],
          },

          $unset: {
            couponCode: "",
          },
        },
        {
          session,
        }
      );
    });

    /**
     * ============================================================
     * بعد نجاح Transaction
     * ============================================================
     */

    if (!createdOrder?._id) {
      throw new Error(
        "ORDER_NOT_FOUND_AFTER_CREATE"
      );
    }

    /**
     * إعادة جلب الطلب من قاعدة البيانات.
     */
    const order =
      await Order.findById(
        createdOrder._id
      );

    if (!order) {
      throw new Error(
        "ORDER_NOT_FOUND_AFTER_CREATE"
      );
    }

    /**
     * ============================================================
     * إرسال البريد + Telegram
     * ============================================================
     *
     * لا ننتظر هذه العمليات حتى لا يتأخر رد checkout.
     */

    void (async () => {
      /**
       * ----------------------------------------------------------
       * البريد الإلكتروني
       * ----------------------------------------------------------
       */

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
        console.error(
          "Order email failed:",
          error
        );
      }

      /**
       * ----------------------------------------------------------
       * Telegram
       * ----------------------------------------------------------
       */

      try {
        const botToken =
          process.env.TELEGRAM_BOT_TOKEN;

        const chatId =
          process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
          return;
        }

        const itemsText =
          order.items
            .map(
              (item: any) =>
                `• Product (qty: ${item.quantity}) - ${item.price} SDG`
            )
            .join("\n");

        const escapeTelegramText = (text: string) =>
          String(text || "").replace(/[_*[\]()~`>#+=|{}.!-]/g, " ");

        const customerName = escapeTelegramText(buyerForEmail?.name || "Customer");
        const shippingAddr = escapeTelegramText(order.shippingAddress || "");
        const trackingNum = escapeTelegramText(order.trackingNumber || "");

        const message = 
  `🚨 طلب جديد في متجر Leadybag!\n\n` +
  `📦 رقم الطلب: #${trackingNum}\n` +
  `👤 اسم العميل: ${customerName}\n` +
  `📍 العنوان: ${shippingAddr}\n\n` +
  `🛒 المنتجات المطلوبة:\n${itemsText}\n\n` +
  `💰 الإجمالي الكلي: ${order.total} SDG`;

        const telegramResponse =
          await fetch(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                chat_id: chatId,
                text: message,
              }),
            }
          );

        if (!telegramResponse.ok) {
          console.error(
            "Telegram returned an error:",
            await telegramResponse.text()
          );
        }
      } catch (error) {
        console.error(
          "Telegram notification failed:",
          error
        );
      }
    })();

    /**
     * ============================================================
     * Response
     * ============================================================
     */

    return NextResponse.json(
      {
        status: "success",

        message:
          "تم إنشاء الطلب بنجاح",

        order,
      },
      {
        status: 201,
      }
    );
  } catch (error: unknown) {
    /**
     * استخراج مفتاح الخطأ.
     */
    const key =
      error instanceof Error
        ? error.message
        : String(error);

    /**
     * الأخطاء المتوقعة.
     */
    const messages: Record<
      string,
      [string, number]
    > = {
      PAYMENT_METHOD_UNAVAILABLE: [
        "طريقة الدفع المختارة غير متاحة حاليًا",
        400,
      ],

      EMPTY_CART: [
        "السلة فارغة، لا يمكن إتمام الطلب",
        400,
      ],

      USER_NOT_FOUND: [
        "المستخدم غير موجود",
        401,
      ],

      PRODUCT_NOT_FOUND: [
        "أحد المنتجات في السلة لم يعد موجودًا",
        409,
      ],

      INVALID_QUANTITY: [
        "كمية أحد المنتجات غير صحيحة",
        400,
      ],

      INVALID_PRODUCT_PRICE: [
        "سعر أحد المنتجات غير صحيح",
        500,
      ],

      INVALID_COUPON: [
        "الكوبون غير صالح أو انتهت صلاحيته",
        400,
      ],

      INSUFFICIENT_STOCK: [
        "بعض المنتجات لم تعد متوفرة بالكمية المطلوبة",
        409,
      ],

      COUPON_LIMIT_REACHED: [
        "تم استنفاد عدد استخدامات الكوبون أثناء إتمام الطلب",
        409,
      ],

      LOYALTY_BALANCE_CHANGED: [
        "تغير رصيد نقاط الولاء، حاول مرة أخرى",
        409,
      ],

      ORDER_NOT_FOUND_AFTER_CREATE: [
        "تعذر العثور على الطلب بعد إنشائه",
        500,
      ],
    };

    const [
      message,
      status,
    ] =
      messages[key] || [
        "حدث خطأ في السيرفر",
        500,
      ];

    /**
     * تسجيل الخطأ الحقيقي في السيرفر فقط.
     */
    if (
      process.env.NODE_ENV !==
      "production"
    ) {
      console.error(
        "Create order error:",
        error
      );
    }

    return NextResponse.json(
      {
        status: "error",
        message,
      },
      {
        status,
      }
    );
  } finally {
    /**
     * إغلاق Session دائمًا.
     */
    if (session) {
      await session.endSession();
    }
  }
}

/**
 * ================================================================
 * GET /api/orders
 * ================================================================
 *
 * العميل:
 *   يرى طلباته فقط.
 *
 * الأدمن:
 *   يرى جميع الطلبات.
 */
export async function GET(
  req: NextRequest
) {
  try {
    const currentUser =
      getCurrentUser(req);

    if (!currentUser) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "يجب تسجيل الدخول",
        },
        {
          status: 401,
        }
      );
    }

    await connectDB();

    /**
     * الأدمن يستطيع رؤية جميع الطلبات.
     *
     * العميل يرى طلباته فقط.
     */
    const filter =
      currentUser.role === "admin"
        ? {}
        : {
            userId:
              currentUser.userId,
          };

    const orders =
      await Order.find(filter)
        .populate(
          "items.productId",
          "name images"
        )
        .populate(
          "userId",
          "name email phone"
        )
        .sort({
          createdAt: -1,
        })
        .limit(100);

    return NextResponse.json({
      status: "success",
      orders,
    });
  } catch (error) {
    if (
      process.env.NODE_ENV !==
      "production"
    ) {
      console.error(
        "Get orders error:",
        error
      );
    }

    return NextResponse.json(
      {
        status: "error",
        message:
          "حدث خطأ في السيرفر",
      },
      {
        status: 500,
      }
    );
  }
}