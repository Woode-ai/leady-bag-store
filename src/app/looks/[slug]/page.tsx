// src/app/looks/[slug]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { apiClient } from "@/lib/apiClient";
import { Sparkles, ShoppingBag, Check, ArrowRight, ShieldCheck } from "lucide-react";

export default function LookDetailPage() {
  const { slug } = useParams();
  const { lang, user, refreshCartCount } = useApp();
  const router = useRouter();

  const [look, setLook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addingAll, setAddingAll] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    async function loadLook() {
      try {
        const data = await apiClient(`/looks/${slug}`);
        setLook(data.look);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (slug) loadLook();
  }, [slug]);

  // إضافة جميع قطع الإطلالة إلى السلة بضغطة واحدة
  async function handleAddAllToCart() {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!look?.products || look.products.length === 0) return;

    setAddingAll(true);
    setAddedSuccess(false);

    try {
      // إضافة كل منتج في الإطلالة إلى السلة
      for (const prod of look.products) {
        if (prod._id) {
          await apiClient("/cart", {
            method: "POST",
            body: JSON.stringify({ productId: prod._id, quantity: 1 }),
          });
        }
      }
      await refreshCartCount();
      setAddedSuccess(true);
      setTimeout(() => {
        router.push("/cart");
      }, 1200);
    } catch (err: unknown) {
      alert((err instanceof Error ? err.message : String(err)) || "حدث خطأ أثناء إضافة المنتجات إلى السلة");
    } finally {
      setAddingAll(false);
    }
  }

  if (loading) {
    return <p className="text-center py-24 text-gray-400">جاري التحميل...</p>;
  }

  if (!look) {
    return (
      <div className="text-center py-24">
        <h2 className="text-xl font-bold text-secondary mb-2">الإطلالة غير موجودة</h2>
        <Link href="/looks" className="text-primary text-sm hover:underline">
          العودة لكل الإطلالات
        </Link>
      </div>
    );
  }

  const products = look.products || [];

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      {/* مسار التصفح Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/" className="hover:text-primary">الرئيسية</Link>
        <span>/</span>
        <Link href="/looks" className="hover:text-primary">تنسيق الإطلالات</Link>
        <span>/</span>
        <span className="text-secondary font-semibold">{look.title?.[lang]}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* صورة الغلاف الكبيرة للإطلالة */}
        <div className="lg:col-span-7">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm relative">
            <img
              src={look.imageUrl}
              alt={look.title?.[lang]}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 start-4 bg-secondary/85 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-full shadow-md flex items-center gap-1.5">
              <Sparkles size={14} className="text-primary" />
              <span>إطلالة كاملة منسقة</span>
            </div>
          </div>
        </div>

        {/* تفاصيل وشراء الإطلالة */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
          <div>
            <span className="text-xs font-bold text-primary tracking-wider uppercase">Shop the Look</span>
            <h1 className="text-2xl md:text-3xl font-black text-secondary mt-1 mb-3">{look.title?.[lang]}</h1>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">{look.description?.[lang]}</p>

            <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-5 mb-6">
              <span className="text-xs text-gray-500 block mb-1">سعر الحزمة الحصري:</span>
              <div className="flex items-baseline gap-3">
                <span className="text-primary font-black text-3xl">{look.bundlePrice} SDG</span>
                {look.originalTotal > look.bundlePrice && (
                  <span className="text-sm text-gray-400 line-through">{look.originalTotal} SDG</span>
                )}
              </div>
              <p className="text-xs text-rose-700 font-bold mt-2">
                وفّري {Math.max(0, (look.originalTotal || 0) - look.bundlePrice)} SDG عند اقتناء الإطلالة كاملة ✨
              </p>
            </div>
          </div>

          <div>
            <button
              onClick={handleAddAllToCart}
              disabled={addingAll}
              className={`w-full py-4 rounded-full font-bold text-base shadow-xl transition-all flex items-center justify-center gap-2 ${
                addedSuccess
                  ? "bg-green-600 text-white"
                  : "bg-primary text-white hover:bg-primary/95 shadow-primary/25 hover:scale-[1.02]"
              } disabled:opacity-50`}
            >
              {addingAll ? (
                "جاري إضافة جميع القطع للسلة..."
              ) : addedSuccess ? (
                <>
                  <Check size={20} /> تمت إضافة الإطلالة كاملة إلى السلة!
                </>
              ) : (
                <>
                  <ShoppingBag size={20} /> إضافة الإطلالة كاملة للسلة
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* المنتجات والقطع المكونة لهذه الإطلالة */}
      <div className="border-t border-gray-100 pt-10">
        <h2 className="text-xl font-bold text-secondary mb-6 flex items-center gap-2">
          <Sparkles className="text-primary" size={20} />
          القطع المكوّنة لهذه الإطلالة ({products.length} قطع)
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {products.map((prod: any) => (
            <Link
              key={prod._id}
              href={`/products/${prod._id}`}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-2xs hover:shadow-md transition-all p-3"
            >
              <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3">
                {prod.images?.[0] ? (
                  <img
                    src={prod.images[0]}
                    alt={prod.name?.[lang]}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>
                )}
              </div>
              <h3 className="font-semibold text-secondary text-sm group-hover:text-primary transition-colors truncate">
                {prod.name?.[lang]}
              </h3>
              <p className="text-primary font-bold text-sm mt-1">
                {prod.discountPrice || prod.price} <span className="text-[10px] text-gray-500 font-normal">SDG</span>
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
