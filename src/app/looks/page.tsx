// src/app/looks/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { apiClient } from "@/lib/apiClient";
import { Sparkles, ArrowRight } from "lucide-react";

export default function LooksPage() {
  const { lang } = useApp();
  const [looks, setLooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLooks() {
      try {
        const data = await apiClient("/looks");
        setLooks(data.looks || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLooks();
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      {/* البانر العلوي */}
      <div className="bg-gradient-to-r from-rose-500/10 via-primary/10 to-rose-500/5 p-8 rounded-3xl border border-rose-100 mb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-bold mb-3">
          <Sparkles size={14} />
          <span>تنسيقات متناسقة بأسعار حزم مخفضة</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-secondary mb-2">تنسيق الإطلالة الكاملة (Shop the Look)</h1>
        <p className="text-gray-600 text-sm max-w-xl mx-auto">
          اختاري إطلالتك المتكاملة من الحقائب والأحذية والإكسسوارات المنسقة بعناية، مع توفير خاص عند شراء الحزمة كاملة.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-3xl h-96"></div>
          ))}
        </div>
      ) : looks.length === 0 ? (
        <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-gray-100">
          <Sparkles className="mx-auto text-primary mb-3" size={48} />
          <h2 className="text-lg font-bold text-secondary mb-1">لا توجد إطلالات متاحة حالياً</h2>
          <p className="text-xs text-gray-400 mb-6">تابعونا قريباً للحصول على أحدث التنسيقات والعروض الحصرية</p>
          <Link href="/products" className="bg-primary text-white px-8 py-3 rounded-full text-sm font-bold shadow-md shadow-primary/20">
            تصفح جميع المنتجات
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {looks.map((look) => (
            <Link
              key={look._id}
              href={`/looks/${look.slug}`}
              className="group bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                <img
                  src={look.imageUrl}
                  alt={look.title?.[lang] || "Look"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 end-4 bg-secondary/85 backdrop-blur-sm text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-md">
                  {look.products?.length || 0} قطع منسقة
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-bold text-secondary text-lg group-hover:text-primary transition-colors">
                  {look.title?.[lang]}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 mt-1.5 leading-relaxed">
                  {look.description?.[lang]}
                </p>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-gray-400 block mb-0.5">سعر الإطلالة كاملة:</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-primary font-black text-xl">{look.bundlePrice} SDG</span>
                      {look.originalTotal > look.bundlePrice && (
                        <span className="text-xs text-gray-400 line-through">{look.originalTotal} SDG</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs bg-rose-50 text-primary font-bold px-3 py-1.5 rounded-full border border-rose-100">
                    وفر {Math.max(0, (look.originalTotal || 0) - look.bundlePrice)} SDG
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}


