// src/app/products/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { apiClient } from "@/lib/apiClient";
import ProductCard from "@/components/ProductCard";
import {
  Search,
  Sparkles,
  SlidersHorizontal,
  X,
  Star,
  CheckCircle2,
  ChevronDown,
  RotateCcw,
} from "lucide-react";

interface Category {
  _id: string;
  name: { ar: string; en: string };
  slug: string;
}

function ProductsContent() {
  const { t, lang } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // حالة الفلاتر المتقدمة
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [inStockOnly, setInStockOnly] = useState(searchParams.get("inStock") === "true");
  const [minRating, setMinRating] = useState(searchParams.get("minRating") || "");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // جلب قائمة الأقسام
  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await apiClient("/categories");
        setCategories(data.categories || []);
      } catch (e) {
        // ignore
      }
    }
    loadCategories();
  }, []);

  // جلب المنتجات عند تغير أي معيار في الـ URL
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        const page = searchParams.get("page") || "1";
        const cat = searchParams.get("category");
        const srch = searchParams.get("search");
        const srt = searchParams.get("sort") || "newest";
        const minP = searchParams.get("minPrice");
        const maxP = searchParams.get("maxPrice");
        const inStk = searchParams.get("inStock");
        const minR = searchParams.get("minRating");

        params.set("page", page);
        params.set("limit", "12");
        params.set("sort", srt);
        if (srch) params.set("search", srch);
        if (cat) params.set("category", cat);
        if (minP) params.set("minPrice", minP);
        if (maxP) params.set("maxPrice", maxP);
        if (inStk === "true") params.set("inStock", "true");
        if (minR) params.set("minRating", minR);

        const data = await apiClient(`/products?${params.toString()}`);
        setProducts(data.products || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [searchParams]);

  function applyFilters(overrides: Record<string, string | boolean | undefined> = {}) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");

    const currentSearch = overrides.search !== undefined ? String(overrides.search) : searchQuery;
    const currentCategory = overrides.category !== undefined ? String(overrides.category) : selectedCategory;
    const currentMin = overrides.minPrice !== undefined ? String(overrides.minPrice) : minPrice;
    const currentMax = overrides.maxPrice !== undefined ? String(overrides.maxPrice) : maxPrice;
    const currentInStock = overrides.inStock !== undefined ? Boolean(overrides.inStock) : inStockOnly;
    const currentRating = overrides.minRating !== undefined ? String(overrides.minRating) : minRating;
    const currentSort = overrides.sort !== undefined ? String(overrides.sort) : sort;

    if (currentSearch.trim()) params.set("search", currentSearch.trim());
    else params.delete("search");

    if (currentCategory) params.set("category", currentCategory);
    else params.delete("category");

    if (currentMin.trim()) params.set("minPrice", currentMin.trim());
    else params.delete("minPrice");

    if (currentMax.trim()) params.set("maxPrice", currentMax.trim());
    else params.delete("maxPrice");

    if (currentInStock) params.set("inStock", "true");
    else params.delete("inStock");

    if (currentRating) params.set("minRating", currentRating);
    else params.delete("minRating");

    if (currentSort) params.set("sort", currentSort);

    router.push(`/products?${params.toString()}`);
  }

  function resetAllFilters() {
    setSearchQuery("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setMinRating("");
    setSort("newest");
    router.push("/products");
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/products?${params.toString()}`);
  }

  const activeFiltersCount = [
    Boolean(searchParams.get("category")),
    Boolean(searchParams.get("minPrice") || searchParams.get("maxPrice")),
    searchParams.get("inStock") === "true",
    Boolean(searchParams.get("minRating")),
  ].filter(Boolean).length;

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* رأس الصفحة العصري */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-gradient-to-r from-primary/10 via-rose-50 to-primary/5 p-6 rounded-3xl border border-primary/15 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary" size={24} />
            <h1 className="text-2xl md:text-3xl font-extrabold text-secondary">{t("products")}</h1>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {lang === "ar"
              ? "استكشفي أحدث تشكيلات الأزياء والحقائب النسائية الفريدة"
              : "Discover exclusive women's fashion and signature handbags"}
          </p>
        </div>

        {/* البحث الفوري السريع */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters();
          }}
          className="relative flex-1 max-w-md"
        >
          <input
            type="text"
            placeholder={lang === "ar" ? "ابحثي باسم المنتج..." : "Search by product name..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-primary/20 rounded-full py-2.5 px-5 pe-12 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          <button
            type="submit"
            className="absolute end-2 top-1/2 -translate-y-1/2 bg-primary text-white p-1.5 rounded-full hover:bg-primary/90 transition-colors shadow-xs"
            title={lang === "ar" ? "بحث" : "Search"}
          >
            <Search size={16} />
          </button>
        </form>
      </div>

      {/* أقسام التبويب السريع (Category Pills) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
        <button
          onClick={() => {
            setSelectedCategory("");
            applyFilters({ category: "" });
          }}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
            !searchParams.get("category")
              ? "bg-secondary text-white shadow-md shadow-secondary/20"
              : "bg-white border border-gray-200 text-gray-600 hover:border-primary/40"
          }`}
        >
          {lang === "ar" ? "كل الأقسام" : "All Categories"}
        </button>
        {categories.map((cat) => (
          <button
            key={cat._id}
            onClick={() => {
              setSelectedCategory(cat._id);
              applyFilters({ category: cat._id });
            }}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              searchParams.get("category") === cat._id
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-white border border-gray-200 text-gray-600 hover:border-primary/40"
            }`}
          >
            {cat.name[lang] || cat.name.ar}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* شريط الفلترة الجانبي على الشاشات الكبيرة (Sidebar Filter) */}
        <aside className="hidden lg:block bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-6 h-fit sticky top-24">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <h3 className="font-bold text-secondary text-base flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-primary" />
              <span>{lang === "ar" ? "تصفية متقدمة" : "Filters"}</span>
            </h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetAllFilters}
                className="text-xs text-rose-500 hover:underline flex items-center gap-1 font-semibold"
              >
                <RotateCcw size={12} /> {lang === "ar" ? "إعادة ضبط" : "Reset"}
              </button>
            )}
          </div>

          {/* فلترة السعر */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              {lang === "ar" ? "نطاق السعر (SDG)" : "Price Range (SDG)"}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="من"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
              <span className="text-gray-400 text-xs">-</span>
              <input
                type="number"
                placeholder="إلى"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
            <button
              onClick={() => applyFilters()}
              className="w-full mt-2 bg-gray-50 hover:bg-primary hover:text-white text-secondary py-1.5 rounded-xl text-xs font-semibold transition-colors border border-gray-200"
            >
              {lang === "ar" ? "تطبيق السعر" : "Apply Price"}
            </button>
          </div>

          {/* التوفر والمخزون */}
          <div className="pt-4 border-t border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  setInStockOnly(e.target.checked);
                  applyFilters({ inStock: e.target.checked });
                }}
                className="rounded text-primary focus:ring-primary w-4 h-4"
              />
              <span className="text-xs font-bold text-secondary">
                {lang === "ar" ? "المنتجات المتوفرة فقط" : "In Stock Only"}
              </span>
            </label>
          </div>

          {/* التقييم */}
          <div className="pt-4 border-t border-gray-100">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              {lang === "ar" ? "التقييم الأدنى" : "Minimum Rating"}
            </label>
            <div className="space-y-1.5">
              {[
                { val: "", label: lang === "ar" ? "جميع التقييمات" : "All ratings" },
                { val: "4", label: "4 نجوم فأكثر ★★★★" },
                { val: "3", label: "3 نجوم فأكثر ★★★" },
              ].map((r) => (
                <label key={r.val} className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
                  <input
                    type="radio"
                    name="minRating"
                    value={r.val}
                    checked={minRating === r.val}
                    onChange={() => {
                      setMinRating(r.val);
                      applyFilters({ minRating: r.val });
                    }}
                    className="text-primary focus:ring-primary w-3.5 h-3.5"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* عرض المنتجات وترتيبها */}
        <div className="lg:col-span-3">
          {/* شريط التحكم بالترتيب */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="text-xs font-semibold text-gray-500">
              {pagination.total > 0
                ? `${pagination.total} ${lang === "ar" ? "منتج معروض" : "products available"}`
                : ""}
            </div>

            <div className="flex items-center gap-3">
              {/* زر إظهار الفلاتر على الموبايل */}
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="lg:hidden flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-bold text-secondary hover:border-primary"
              >
                <SlidersHorizontal size={14} />
                <span>{lang === "ar" ? "الفلاتر" : "Filters"}</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-secondary">{t("sortBy")}:</span>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    applyFilters({ sort: e.target.value });
                  }}
                  className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs bg-white text-secondary font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer shadow-xs"
                >
                  <option value="newest">{t("newest")}</option>
                  <option value="price_asc">{t("priceLowHigh")}</option>
                  <option value="price_desc">{t("priceHighLow")}</option>
                  <option value="popular">{lang === "ar" ? "الأكثر تقييماً" : "Most Rated"}</option>
                </select>
              </div>
            </div>
          </div>

          {/* فلاتر الموبايل المنسدلة */}
          {showMobileFilters && (
            <div className="lg:hidden mb-6 bg-white border border-gray-200 rounded-3xl p-5 space-y-4 shadow-md animate-in fade-in duration-200">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <h4 className="font-bold text-secondary text-sm">{lang === "ar" ? "تصفية المنتجات" : "Filters"}</h4>
                <button onClick={() => setShowMobileFilters(false)} className="text-gray-400">
                  <X size={18} />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="أدنى سعر"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-1/2 border border-gray-200 rounded-xl p-2 text-xs"
                />
                <input
                  type="number"
                  placeholder="أعلى سعر"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-1/2 border border-gray-200 rounded-xl p-2 text-xs"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-bold">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded text-primary"
                />
                <span>{lang === "ar" ? "المنتجات المتوفرة فقط" : "In stock only"}</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    applyFilters();
                    setShowMobileFilters(false);
                  }}
                  className="flex-1 bg-primary text-white py-2 rounded-xl text-xs font-bold"
                >
                  {lang === "ar" ? "تطبيق" : "Apply"}
                </button>
                <button
                  onClick={resetAllFilters}
                  className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  {lang === "ar" ? "إعادة ضبط" : "Reset"}
                </button>
              </div>
            </div>
          )}

          {/* شبكة المنتجات مع تأثيرات التحميل الهيكلية (Skeleton / Shimmer) */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-3xl p-3 space-y-3 animate-pulse">
                  <div className="aspect-square bg-gray-100 rounded-2xl w-full" />
                  <div className="h-4 bg-gray-100 rounded-md w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-md w-1/2" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-5 bg-gray-100 rounded-md w-1/3" />
                    <div className="w-8 h-8 bg-gray-100 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-gray-100 p-8">
              <Search className="mx-auto text-gray-300 mb-3" size={48} />
              <p className="text-secondary font-bold text-lg mb-1">{t("noProducts")}</p>
              <p className="text-gray-400 text-xs max-w-sm mx-auto mb-4 leading-relaxed">
                {lang === "ar"
                  ? "لم نجد أي منتجات تطابق معايير الفلترة الحالية. جربي تغيير نطاق السعر أو تصفح كل الأقسام."
                  : "No products matched your filter criteria. Try adjusting your search or filters."}
              </p>
              <button
                onClick={resetAllFilters}
                className="bg-primary text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-md shadow-primary/20 hover:scale-105 transition-all"
              >
                {lang === "ar" ? "عرض كل المنتجات" : "View All Products"}
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* ترقيم الصفحات */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`w-9 h-9 rounded-xl font-bold text-xs transition-all ${
                        p === pagination.page
                          ? "bg-primary text-white shadow-md shadow-primary/20 scale-105"
                          : "bg-white border border-gray-200 text-secondary hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-400">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">جاري تحميل المتجر...</p>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
