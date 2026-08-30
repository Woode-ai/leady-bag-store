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

        <h1 className="text-2xl md:text-3xl font-black text-secondary mb-2">ØªÙ… Ø§Ø³ØªÙ„Ø§Ù… Ø·Ù„Ø¨Ùƒ Ø¨Ù†Ø¬Ø§Ø­!</h1>
        <p className="text-gray-500 text-sm mb-6">Ø´ÙƒØ±Ø§Ù‹ Ù„ØªØ³ÙˆÙ‚Ùƒ Ù…Ù† Leadybag. Ø³Ù†Ø¨Ø¯Ø£ Ø¨ØªØ¬Ù‡ÙŠØ² Ø·Ù„Ø¨Ùƒ Ø¹Ù„Ù‰ Ø§Ù„ÙÙˆØ±.</p>

        {order && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 text-sm text-start space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Ø±Ù‚Ù… Ø§Ù„ØªØªØ¨Ø¹:</span>
              <span className="font-mono font-bold text-secondary">{order.trackingNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ:</span>
              <span className="font-black text-primary">{order.total} SDG</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø¯ÙØ¹:</span>
              <span className="font-semibold text-secondary">{order.paymentMethod?.name?.ar}</span>
            </div>
          </div>
        )}

        {/* ØªÙ†Ø¨ÙŠÙ‡ ØªØ­ÙˆÙŠÙ„ Ø¨Ù†ÙƒÙƒ Ù„Ø±ÙØ¹ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø± Ù…Ø¨Ø§Ø´Ø±Ø© */}
        {order && order.paymentMethod?.type === "bank_transfer" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-start mb-6">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-1">
              <Upload size={16} />
              <span>Ø¥Ø´Ø¹Ø§Ø± Ø§Ù„ØªØ­ÙˆÙŠÙ„ Ø§Ù„Ø¨Ù†ÙƒÙŠ (Ø¨Ù†ÙƒÙƒ):</span>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              ÙŠØ±Ø¬Ù‰ ØªØ­ÙˆÙŠÙ„ Ø§Ù„Ù…Ø¨Ù„Øº Ø«Ù… Ø§Ù„ØªÙˆØ¬Ù‡ Ù„Ø­Ø³Ø§Ø¨Ùƒ Ù„Ø±ÙØ¹ Ø±Ù‚Ù… Ø§Ù„Ù…Ø¹Ø§Ù…Ù„Ø© ÙˆØµÙˆØ±Ø© Ø§Ù„Ø¥Ø´Ø¹Ø§Ø± Ù„ÙŠØªÙ… Ø§Ø¹ØªÙ…Ø§Ø¯ Ø·Ù„Ø¨Ùƒ ÙÙˆØ±Ø§Ù‹.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/account"
            className="bg-primary text-white px-7 py-3 rounded-full font-bold shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all text-sm"
          >
            Ø¹Ø±Ø¶ Ø§Ù„Ø·Ù„Ø¨ ÙˆØ±ÙØ¹ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±
          </Link>
          <Link
            href="/products"
            className="bg-gray-100 text-secondary px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition-all text-sm"
          >
            Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªØ³ÙˆÙ‚
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-gray-400">Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}


