// src/app/products/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { apiClient } from "@/lib/apiClient";
import ProductCard from "@/components/ProductCard";
import { Search, Sparkles, SlidersHorizontal } from "lucide-react";

interface PaginationType {
  page: number;
  totalPages: number;
  total?: number;
}
function ProductsContent() {
  const { t, lang } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // البحث بالاسم فقط والفرز
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        const page = searchParams.get("page") || "1";
        const category = searchParams.get("category");
        const currentSearch = searchParams.get("search");

        params.set("page", page);
        params.set("limit", "12");
        params.set("sort", sort);
        if (currentSearch) params.set("search", currentSearch);
        if (category) params.set("category", category);

        const data = await apiClient(`/products?${params.toString()}`);
        setProducts(data.products || []);
        setPagination(data.pagination || { page: 1, totalPages: 1 });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [searchParams, sort]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    } else {
      params.delete("search");
    }
    router.push(`/products?${params.toString()}`);
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/products?${params.toString()}`);
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* رأس الصفحة العصري */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-gradient-to-r from-primary/10 via-rose-50 to-primary/5 p-6 rounded-2xl border border-primary/15 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary" size={24} />
            <h1 className="text-2xl md:text-3xl font-bold text-secondary">{t("products")}</h1>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {lang === "ar"
              ? "استكشفي أحدث تشكيلات الأزياء والحقائب النسائية الفريدة"
              : "Discover the latest exclusive women's fashion and handbags collection"}
          </p>
        </div>

        {/* البحث عن طريق اسم المنتج فقط */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder={lang === "ar" ? "ابحثي باسم المنتج..." : "Search by product name..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-primary/20 rounded-full py-2.5 px-5 pe-12 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          <button
            type="submit"
            className="absolute end-2 top-1/2 -translate-y-1/2 bg-primary text-white p-1.5 rounded-full hover:bg-primary/90 transition-colors"
            title={lang === "ar" ? "بحث" : "Search"}
          >
            <Search size={16} />
          </button>
        </form>
      </div>

      {/* شريط التحكم بالترتيب */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div className="text-sm text-gray-500">
          {(pagination as any).total ? `${(pagination as any).total} ${lang === "ar" ? "منتج متاح" : "products found"}` : ""}
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-secondary">{t("sortBy")}:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white text-secondary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="newest">{t("newest")}</option>
            <option value="price_asc">{t("priceLowHigh")}</option>
            <option value="price_desc">{t("priceHighLow")}</option>
          </select>
        </div>
      </div>

      {/* شبكة المنتجات */}
      <div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-72"></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-gray-50/50 rounded-2xl border border-gray-100">
            <Search className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-secondary font-medium text-lg mb-1">{t("noProducts")}</p>
            <p className="text-gray-400 text-sm">
              {lang === "ar" ? "جربي البحث بكلمات أخرى أو تصفح كل المنتجات" : "Try searching with different keywords"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
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
                    className={`w-9 h-9 rounded-xl font-medium text-sm transition-all ${
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
    </main>
  );
}

// Suspense مطلوب لأن useSearchParams يحتاجها Next.js عند التصدير الثابت
export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-gray-400">...</div>}>
      <ProductsContent />
    </Suspense>
  );
}


