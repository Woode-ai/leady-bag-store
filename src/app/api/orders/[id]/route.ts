// src/app/api/orders/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import Settings from "@/models/Settings";
import { getCurrentUser, requireAdmin } from "@/lib/auth";

function positiveNumber(
  value: unknown,
  fallback: number
) {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0
    ? number
    : fallback;
}

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const currentUser =
      getCurrentUser(req);

    if (!currentUser) {
      return NextResponse.json(
        {
          status: "error",
          message: "يجب تسجيل الدخول",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await params;

    await connectDB();

    const order =
      await Order.findById(id).populate(
        "items.productId",
        "name images"
      );

    if (!order) {
      return NextResponse.json(
        {
          status: "error",
          message: "الطلب غير موجود",
        },
        {
          status: 404,
        }
      );
    }

    if (
      currentUser.role !== "admin" &&
      order.userId.toString() !==
        currentUser.userId
    ) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "غير مصرح لك برؤية هذا الطلب",
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json({
      status: "success",
      order,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        status: "error",
        message: "حدث خطأ في السيرفر",
        ...(process.env.NODE_ENV !==
          "production" && {
          error:
            error instanceof Error
              ? error.message
              : String(error),
        }),
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  const admin = requireAdmin(req);

  if (!admin) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "غير مصرح لك - هذا الإجراء للأدمن فقط",
      },
      {
        status: 403,
      }
    );
  }

  let session: any = null;

  try {
    const { id } = await params;

    await connectDB();

    const body = await req.json();

    const {
      status,
      paymentStatus,
      trackingNumber,
    } = body;

    /*
     * ============================================================
     * الحالات المسموحة
     * ============================================================
     */

    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "returned",
    ];

    if (
      status &&
      !validStatuses.includes(status)
    ) {
      return NextResponse.json(
        {
          status: "error",
          message: "حالة الطلب غير صحيحة",
        },
        {
          status: 400,
        }
      );
    }

    const validPaymentStatuses = [
      "pending_verification",
      "verified",
      "rejected",
      "pending",
      "paid",
      "failed",
      "cod",
    ];

    if (
      paymentStatus &&
      !validPaymentStatuses.includes(
        paymentStatus
      )
    ) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "حالة الدفع غير صحيحة",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ============================================================
     * لا يوجد شيء لتحديثه
     * ============================================================
     */

    if (
      !status &&
      !paymentStatus &&
      !trackingNumber
    ) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "لم يتم إرسال أي بيانات للتحديث",
        },
        {
          status: 400,
        }
      );
    }

    session = await Order.startSession();

    let finalOrder: any = null;

    await session.withTransaction(
      async () => {
        const existingOrder =
          await Order.findById(id).session(
            session
          );

        if (!existingOrder) {
          throw new Error(
            "ORDER_NOT_FOUND"
          );
        }

        const updateData: Record<
          string,
          unknown
        > = {};

        if (status) {
          updateData.status = status;
        }

        if (paymentStatus) {
          updateData.paymentStatus =
            paymentStatus;
        }

        /*
         * نسمح بتفريغ trackingNumber إذا أرسل
         * نصًا فارغًا؟ لا، نحافظ على القيمة الحالية.
         */
        if (
          typeof trackingNumber ===
            "string" &&
          trackingNumber.trim()
        ) {
          updateData.trackingNumber =
            trackingNumber.trim();
        }

        /*
         * ========================================================
         * حالة التسليم
         * ========================================================
         *
         * إذا أصبح الطلب delivered لأول مرة:
         *
         * 1. نحسب النقاط.
         * 2. نضيفها للمستخدم.
         * 3. نضع loyaltyPointsAwarded = true.
         *
         * الثلاثة داخل Transaction واحدة.
         */

        const isTransitionToDelivered =
          status === "delivered" &&
          existingOrder.status !==
            "delivered";

        if (
          isTransitionToDelivered &&
          existingOrder.loyaltyPointsAwarded !==
            true
        ) {
          const settings =
            await Settings.findOne().session(
              session
            );

          const rate =
            positiveNumber(
              settings?.pointsPerCurrencySpent,
              1
            );

          /*
           * rate = عدد النقاط لكل 100 SDG.
           *
           * مثال:
           * total = 10,000
           * rate = 1
           * => 100 نقطة
           */

          const earnedPoints =
            rate > 0
              ? Math.floor(
                  (Math.max(
                    0,
                    Number(
                      existingOrder.total || 0
                    )
                  ) /
                    100) *
                    rate
                )
              : 0;

          /*
           * نضع علامة منح النقاط داخل نفس
           * Transaction.
           */
          updateData.loyaltyPointsAwarded =
            true;

          /*
           * تحديث الطلب أولاً داخل Transaction.
           */
          finalOrder =
            await Order.findByIdAndUpdate(
              id,
              {
                $set: updateData,
              },
              {
                new: true,
                session,
              }
            );

          if (!finalOrder) {
            throw new Error(
              "ORDER_NOT_FOUND"
            );
          }

          /*
           * إضافة النقاط للمستخدم.
           *
           * إذا فشل هذا التحديث:
           * Transaction كلها ترجع للخلف.
           */
          if (earnedPoints > 0) {
            const userUpdate =
              await User.updateOne(
                {
                  _id:
                    existingOrder.userId,
                },
                {
                  $inc: {
                    loyaltyPoints:
                      earnedPoints,
                  },
                },
                {
                  session,
                }
              );

            if (
              userUpdate.modifiedCount !==
              1
            ) {
              throw new Error(
                "LOYALTY_USER_UPDATE_FAILED"
              );
            }
          }
        } else {
          /*
           * أي تحديث عادي لا يتعلق بمنح
           * نقاط جديدة.
           */
          finalOrder =
            await Order.findByIdAndUpdate(
              id,
              {
                $set: updateData,
              },
              {
                new: true,
                session,
              }
            );

          if (!finalOrder) {
            throw new Error(
              "ORDER_NOT_FOUND"
            );
          }
        }
      }
    );

    return NextResponse.json({
      status: "success",
      message:
        "تم تحديث الطلب بنجاح",
      order: finalOrder,
    });
  } catch (error: unknown) {
    const key =
      error instanceof Error
        ? error.message
        : String(error);

    const errors: Record<
      string,
      [string, number]
    > = {
      ORDER_NOT_FOUND: [
        "الطلب غير موجود",
        404,
      ],

      LOYALTY_USER_UPDATE_FAILED: [
        "تعذر تحديث نقاط العميل، ولم يتم اعتماد تغيير حالة الطلب",
        500,
      ],
    };

    const [message, status] =
      errors[key] || [
        "حدث خطأ في السيرفر",
        500,
      ];

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
    if (session) {
      await session.endSession();
    }
  }
}