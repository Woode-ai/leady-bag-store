// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { apiClient } from "@/lib/apiClient";
import ProductCard from "@/components/ProductCard";
import { Sparkles, Gift, ArrowRight, ShieldCheck, Truck, RefreshCcw } from "lucide-react";

interface Category {
  _id: string;
  name: { ar: string; en: string };
  slug: string;
  image?: string;
}

interface Product {
  _id: string;
  name: { ar: string; en: string };
  price: number;
  discountPrice?: number;
  images: string[];
  stock: number;
  ratings: { rating: number }[];
}

export default function Home() {
  const { t, lang } = useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [looks, setLooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, prodRes, looksRes] = await Promise.all([
          apiClient("/categories"),
          apiClient("/products?limit=8&sort=newest"),
          apiClient("/looks").catch(() => ({ looks: [] })),
        ]);
        setCategories(catRes.categories || []);
        setProducts(prodRes.products || []);
        setLooks(looksRes.looks || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <main>
      {/* البانر الرئيسي: استخدام bg-cover لتطابق الصورة جميع الشاشات وتحافظ على جودتها وتملأ المكان */}
      <section 
        className="relative overflow-hidden py-28 px-4 border-b border-rose-100/60 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/woode.jpg')` }}
      >
        
        {/* طبقة شفافة ناعمة (يمكنك التحكم بدرجة الشفافية من خلال white/65 مثلاً لزيادة أو تقليل وضوح الصورة) */}
        <div className="absolute inset-0 bg-white/55 backdrop-blur-[0.5px]"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-5 py-2 rounded-full text-xs font-bold mb-6 shadow-sm tracking-wide">
            <Sparkles size={14} className="animate-pulse" />
            <span>المتجر النسائي الأول في السودان</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-secondary mb-6 tracking-tight leading-[1.2] drop-shadow-sm">
            {t("heroTitle")}
          </h1>
          <p className="text-gray-600 mb-10 text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
            {t("heroSubtitle")}
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/products"
              className="bg-primary text-white px-10 py-4 rounded-full font-bold shadow-lg shadow-primary/30 hover:bg-primary/95 transition-all hover:scale-105 text-sm md:text-base"
            >
              {t("shopNow")}
            </Link>
            <Link
              href="/looks"
              className="bg-white/90 backdrop-blur-md text-secondary border border-rose-200/80 px-8 py-4 rounded-full font-bold hover:bg-rose-50/50 transition-all flex items-center gap-2 shadow-sm text-sm md:text-base"
            >
              <Sparkles size={16} className="text-rose-500" />
              <span>تنسيق الإطلالة</span>
            </Link>
          </div>
        </div>
      </section>

      {/* مميزات المتجر السريعة */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 bg-gray-50/60 p-4 rounded-2xl border border-gray-100">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="font-bold text-secondary text-xs">دفع الكترونى امن</h4>
              <p className="text-[11px] text-gray-500">تحويل مباشر وتأكيد سريع</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-gray-50/60 p-4 rounded-2xl border border-gray-100">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
              <RefreshCcw size={20} />
            </div>
            <div>
              <h4 className="font-bold text-secondary text-xs">استرجاع خلال 24 ساعة</h4>
              <p className="text-[11px] text-gray-500">ضمان كامل لرضاك</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-gray-50/60 p-4 rounded-2xl border border-gray-100">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
              <Gift size={20} />
            </div>
            <div>
              <h4 className="font-bold text-secondary text-xs">نقاط ومكافآت هدايا</h4>
              <p className="text-[11px] text-gray-500">خصومات نقدية مع كل طلب</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-gray-50/60 p-4 rounded-2xl border border-gray-100">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Truck size={20} />
            </div>
            <div>
              <h4 className="font-bold text-secondary text-xs">توصيل لكافة المدن</h4>
              <p className="text-[11px] text-gray-500">توصيل سريع ومضمون</p>
            </div>
          </div>
        </div>
      </section>

      {/* قسم Shop the Look (تنسيق الإطلالة الكاملة) */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary" size={24} />
              <h2 className="text-2xl md:text-3xl font-black text-secondary">chik the loook😍</h2>
            </div>
            <p className="text-gray-500 text-sm mt-1">حقائب وأحذية وإكسسوارات متناسقه مميزه لاجلك فقط🤗😚</p>
          </div>
          <Link href="/looks" className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
            اطلالتك<ArrowRight size={16} />
          </Link>
        </div>

        {looks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {looks.slice(0, 3).map((look) => (
              <Link
                key={look._id}
                href={`/looks/${look.slug}`}
                className="group bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                  <img
                    src={look.imageUrl || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop"}
                    alt={look.title?.[lang]}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 end-3 bg-secondary/85 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    {look.products?.length || 0} قطع منسقة
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-bold text-secondary text-lg group-hover:text-primary transition-colors">
                    {look.title?.[lang]}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">{look.description?.[lang]}</p>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 block">سعر الإطلالة كاملة:</span>
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
        ) : (
          <div className="text-center py-12 bg-rose-50/40 rounded-3xl border border-rose-100">
            <Sparkles className="mx-auto text-primary mb-2" size={36} />
            <h3 className="font-bold text-secondary mb-1">إطلالات الموسم قريباً!</h3>
            <p className="text-xs text-gray-500"> نضمن لكى افضل الاطلالات باستشاره خبراء الموضى </p>
          </div>
        )}
      </section>

      {/* الأقسام */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-secondary mb-6">{t("categories")}</h2>

        {categories.length === 0 && !loading ? (
          <p className="text-gray-400 text-center py-8">
            {lang === "ar" ? "لا توجد أقسام بعد" : "No categories yet"}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                href={`/products?category=${cat._id}`}
                className="group text-center bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs hover:border-primary/30 transition-all"
              >
                <div className="aspect-square rounded-xl bg-gray-50 overflow-hidden mb-2">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name[lang]}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary font-bold text-xl">
                      {cat.name[lang][0]}
                    </div>
                  )}
                </div>
                <p className="text-sm font-semibold text-secondary">{cat.name[lang]}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* منتجات مميزة */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-secondary">{t("featuredProducts")}</h2>
          <Link href="/products" className="text-primary text-sm font-bold hover:underline">
            {t("viewAll")}
          </Link>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-8">{t("loading")}</p>
        ) : products.length === 0 ? (
          <p className="text-gray-400 text-center py-8">{t("noProducts")}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}