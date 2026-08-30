// src/app/order-success/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { apiClient } from "@/lib/apiClient";
import { CheckCircle2, Gift, Upload, ArrowRight, ShieldCheck } from "lucide-react";

function OrderSuccessContent() {
  const { t, lang } = useApp();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) return;
      try {
        const data = await apiClient(`/orders/${orderId}`);
        setOrder(data.order);
      } catch (err) {
        console.error(err);
      }
    }
    loadOrder();
  }, [orderId]);

  return (
    <main className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={40} />
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-secondary mb-2">تم استلام طلبك بنجاح!</h1>
        <p className="text-gray-500 text-sm mb-6">شكراً لتسوقك من Leadybag. سنبدأ بتجهيز طلبك على الفور.</p>

        {order && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 text-sm text-start space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">رقم التتبع:</span>
              <span className="font-mono font-bold text-secondary">{order.trackingNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">الإجمالي النهائي:</span>
              <span className="font-black text-primary">{order.total} SDG</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">طريقة الدفع:</span>
              <span className="font-semibold text-secondary">{order.paymentMethod?.name?.ar}</span>
            </div>
          </div>
        )}

        {/* تنبيه تحويل بنكك لرفع الإشعار مباشرة */}
        {order && order.paymentMethod?.type === "bank_transfer" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-start mb-6">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-1">
              <Upload size={16} />
              <span>إشعار التحويل البنكي (بنكك):</span>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              يرجى تحويل المبلغ ثم التوجه لحسابك لرفع رقم المعاملة وصورة الإشعار ليتم اعتماد طلبك فوراً.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/account"
            className="bg-primary text-white px-7 py-3 rounded-full font-bold shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all text-sm"
          >
            عرض الطلب ورفع الإشعار
          </Link>
          <Link
            href="/products"
            className="bg-gray-100 text-secondary px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition-all text-sm"
          >
            متابعة التسوق
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-gray-400">جاري التحميل...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}


