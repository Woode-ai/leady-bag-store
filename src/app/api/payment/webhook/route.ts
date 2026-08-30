// src/app/api/payment/webhook/route.ts
// POST /api/payment/webhook
// هذا الرابط لا يستدعيه المستخدم أبداً - بل Stripe نفسه يستدعيه تلقائياً
// عندما يكتمل الدفع بنجاح، ليخبرنا "هذا الطلب تم دفعه فعلياً"
// نستخدم هذا بدلاً من الثقة في المتصفح، لأن المتصفح يمكن التلاعب به، أما Stripe فموثوق

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature") as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

    let event;
    try {
      // نتأكد أن هذا الطلب فعلاً من Stripe وليس مزوّراً من أي شخص آخر
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: unknown) {
      return NextResponse.json(
        { status: "error", message: `خطأ في توقيع الـ Webhook: ${(err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err))}` },
        { status: 400 }
      );
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const orderId = session.metadata?.orderId;

      if (!orderId || session.payment_status !== "paid") {
        return NextResponse.json({ received: true });
      }

      await connectDB();
      const order = await Order.findById(orderId);

      if (!order) {
        return NextResponse.json({ status: "error", message: "الطلب غير موجود" }, { status: 400 });
      }

      const expectedAmount = Math.round(order.total * 100);
      const receivedAmount = Number(session.amount_total);
      const receivedCurrency = String(session.currency || "").toLowerCase();

      if (
        receivedAmount !== expectedAmount ||
        receivedCurrency !== "usd"
      ) {
        return NextResponse.json(
          { status: "error", message: "بيانات الدفع لا تطابق قيمة الطلب" },
          { status: 400 }
        );
      }

      if (order.paymentStatus !== "paid") {
        order.paymentStatus = "paid";
        if (order.status === "pending") order.status = "processing";
        await order.save();
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "حدث خطأ في السيرفر", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


