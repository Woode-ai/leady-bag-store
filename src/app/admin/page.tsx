// src/app/admin/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/apiClient";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Box,
  Calculator,
  CircleDollarSign,
  Clock,
  Package,
  ShoppingBag,
  TrendingUp,
  Wallet,
  RefreshCw,
  XCircle,
  Bell,
  Sparkles,
} from "lucide-react";

type Analytics = {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;

  totalOrders: number;
  totalItemsSold: number;
  totalProducts: number;

  totalDiscount: number;
  averageOrderValue: number;

  pendingOrders: number;
  cancelledOrders: number;
  returnedOrders: number;

  productsWithoutCost: number;

  lowStockProducts: any[];

  topProducts: {
    name: string;
    count: number;
    revenue: number;
    cost: number;
    profit: number;
  }[];

  last7Days: {
    date: string;
    sales: number;
    cost: number;
    profit: number;
    orders: number;
    items: number;
  }[];
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("ar-SD", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ar-SD").format(Number(value) || 0);
}

function StatCard({
  title,
  value,
  suffix = "SDG",
  icon,
  description,
  type = "default",
}: {
  title: string;
  value: string | number;
  suffix?: string;
  icon: React.ReactNode;
  description?: string;
  type?: "default" | "success" | "warning" | "danger";
}) {
  const styles = {
    default: "bg-primary/10 text-primary",
    success: "bg-emerald-50 text-emerald-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-gray-400 font-bold">{title}</p>
          <div className="flex items-end gap-1.5 mt-2">
            <span className="text-2xl font-black text-secondary">{value}</span>
            {suffix && <span className="text-[10px] text-gray-400 mb-1">{suffix}</span>}
          </div>
          {description && <p className="text-[11px] text-gray-400 mt-2 font-medium">{description}</p>}
        </div>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${styles[type]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const loadAnalytics = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError("");
    try {
      const data = await apiClient("/analytics");
      if (!data?.analytics) {
        throw new Error(data?.message || "تعذر تحميل الإحصائيات");
      }
      setAnalytics(data.analytics);
      setLastRefreshed(new Date());
    } catch (err: unknown) {
      if (!isSilent) {
        setError(err instanceof Error ? err.message : "حدث خطأ أثناء تحميل الإحصائيات");
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // تحديث تلقائي ذكي كل 30 ثانية للطلبات والإشعارات الحية
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadAnalytics(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadAnalytics]);

  if (loading) {
    return (
      <div dir="rtl" className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-xs font-semibold mt-4">جاري تحميل لوحة التحكم الذكية...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div dir="rtl" className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-white border border-rose-100 rounded-3xl p-8 text-center max-w-md w-full shadow-sm">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <XCircle size={28} />
          </div>
          <h2 className="font-bold text-secondary mt-4">تعذر تحميل الإحصائيات</h2>
          <p className="text-xs text-gray-400 mt-2">{error || "حدث خطأ غير معروف"}</p>
          <button
            onClick={() => loadAnalytics()}
            className="mt-5 bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2"
          >
            <RefreshCw size={14} />
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const maxSale = Math.max(...analytics.last7Days.map((day) => day.sales), 1);

  return (
    <main dir="rtl" className="space-y-8 pb-10">
      {/* =====================================================
          HEADER & REAL-TIME ALERTS
      ====================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <BarChart3 size={21} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-secondary">لوحة القيادة والتحليلات</h1>
                {analytics.pendingOrders > 0 && (
                  <span className="flex items-center gap-1 bg-amber-500 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full animate-bounce">
                    <Bell size={11} /> {analytics.pendingOrders} طلبات جديدة
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                آخر تحديث: {lastRefreshed.toLocaleTimeString("ar-SD")} (تحديث حي كل 30 ثانية)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
              autoRefresh
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-gray-100 text-gray-500 border-gray-200"
            }`}
          >
            {autoRefresh ? "التحديث التلقائي مفعّل ✓" : "التحديث التلقائي معطّل"}
          </button>
          <button
            onClick={() => loadAnalytics()}
            className="flex items-center gap-1.5 bg-white border border-gray-200 text-secondary px-4 py-2 rounded-xl text-xs font-bold hover:border-primary/30 hover:text-primary transition-all shadow-xs"
          >
            <RefreshCw size={14} />
            تحديث فوري
          </button>
        </div>
      </div>

      {/* =====================================================
          MAIN FINANCIAL STATISTICS
      ====================================================== */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="إجمالي المبيعات المحققة"
            value={formatMoney(analytics.totalRevenue)}
            icon={<CircleDollarSign size={21} />}
            description="الطلبات المعتمدة والمدفوعة"
          />

          <StatCard
            title="تكلفة مشتريات البضاعة"
            value={formatMoney(analytics.totalCost)}
            icon={<ShoppingBag size={21} />}
            description="سعر شراء المنتجات المباعة من الموردين"
            type="warning"
          />

          <StatCard
            title="صافي الربح الفعلي"
            value={formatMoney(analytics.totalProfit)}
            icon={<TrendingUp size={21} />}
            description={`هامش ربح إجمالي ${formatNumber(analytics.profitMargin)}%`}
            type="success"
          />

          <StatCard
            title="متوسط قيمة السلة (AOV)"
            value={formatMoney(analytics.averageOrderValue)}
            icon={<Wallet size={21} />}
            description="متوسط قيمة المشتريات للطلب الواحد"
          />
        </div>
      </section>

      {/* =====================================================
          SECONDARY METRICS
      ====================================================== */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="إجمالي الطلبات"
            value={formatNumber(analytics.totalOrders)}
            suffix="طلب"
            icon={<Package size={20} />}
          />

          <StatCard
            title="القطع المباعة"
            value={formatNumber(analytics.totalItemsSold)}
            suffix="قطعة"
            icon={<Box size={20} />}
          />

          <StatCard
            title="المنتجات في المتجر"
            value={formatNumber(analytics.totalProducts)}
            suffix="منتج"
            icon={<ShoppingBag size={20} />}
          />

          <StatCard
            title="إجمالي الخصومات الممنوحة"
            value={formatMoney(analytics.totalDiscount)}
            icon={<Calculator size={20} />}
            type="warning"
          />
        </div>
      </section>

      {/* =====================================================
          ALERT COST PRICE
      ====================================================== */}
      {analytics.productsWithoutCost > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>

          <div>
            <h3 className="font-bold text-amber-900 text-sm">
              تنبيه: منتجات بدون سعر شراء محدد ({formatNumber(analytics.productsWithoutCost)} منتج)
            </h3>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              يرجى إضافة سعر الشراء (purchasePrice) لكافة المنتجات لضمان دقة حساب صافي الأرباح والتكاليف.
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          INTERACTIVE SALES & REVENUE CHART
      ====================================================== */}
      <section className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-7">
          <div>
            <h2 className="font-black text-secondary text-lg flex items-center gap-2">
              <BarChart3 size={19} className="text-primary" />
              حركة المبيعات خلال آخر 7 أيام
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              مقارنة المبيعات اليومية وحجم الطلبات
            </p>
          </div>

          <div className="bg-primary/10 text-primary px-3.5 py-1.5 rounded-full text-xs font-extrabold">
            {formatMoney(analytics.last7Days.reduce((sum, day) => sum + day.sales, 0))} SDG
          </div>
        </div>

        <div className="h-64 flex items-end gap-2 md:gap-4">
          {analytics.last7Days.map((day) => {
            const percentage = (day.sales / maxSale) * 100;
            const height = day.sales > 0 ? Math.max(percentage, 8) : 4;
            const date = new Date(`${day.date}T00:00:00`);
            const label = date.toLocaleDateString("ar-SD", { weekday: "short" });

            return (
              <div
                key={day.date}
                className="flex-1 h-full flex flex-col items-center justify-end gap-2 min-w-0 group"
              >
                <div className="text-[9px] md:text-[10px] text-gray-400 truncate group-hover:text-primary font-bold">
                  {formatMoney(day.sales)}
                </div>

                <div className="w-full max-w-12 h-48 flex items-end bg-gray-50 rounded-t-xl overflow-hidden p-1">
                  <div
                    className="w-full bg-gradient-to-t from-primary to-primary/80 rounded-t-lg group-hover:opacity-90 transition-all duration-300"
                    style={{ height: `${height}%` }}
                    title={`${day.date}: ${formatMoney(day.sales)} SDG (${day.orders} طلبات)`}
                  />
                </div>

                <div className="text-[10px] md:text-xs font-bold text-gray-600">{label}</div>
                <div className="text-[9px] text-gray-400">{day.date.slice(5)}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================
          TOP PRODUCTS & INVENTORY ALERTS
      ====================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TOP PRODUCTS */}
        <section className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-black text-secondary text-base">الأكثر مبيعاً</h2>
              <p className="text-xs text-gray-400 mt-0.5">أفضل 5 منتجات حسب الكميات المباعة</p>
            </div>
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <TrendingUp size={19} />
            </div>
          </div>

          {analytics.topProducts.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              لا توجد بيانات مبيعات مسجلة حتى الآن
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.topProducts.map((product, index) => (
                <div
                  key={`${product.name}-${index}`}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/70 border border-gray-100"
                >
                  <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center font-black text-primary text-xs shadow-xs">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-secondary text-xs truncate">{product.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{formatNumber(product.count)} قطعة مباعة</p>
                  </div>
                  <div className="text-left">
                    <p className="text-primary font-black text-xs">{formatMoney(product.revenue)} SDG</p>
                    <p className="text-[9px] text-emerald-600 font-bold">ربح: {formatMoney(product.profit)} SDG</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* LOW STOCK */}
        <section className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-black text-secondary text-base">تنبيهات انخفاض المخزون</h2>
              <p className="text-xs text-gray-400 mt-0.5">المنتجات التي اقترب نفاد كمياتها (&lt; 5)</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <AlertTriangle size={19} />
            </div>
          </div>

          {analytics.lowStockProducts.length === 0 ? (
            <div className="py-12 text-center text-xs text-emerald-600 font-bold">
              جميع المنتجات متوفرة بكميات كافية ✓
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.lowStockProducts.slice(0, 5).map((product) => (
                <div
                  key={product._id}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-gray-50/70 border border-gray-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                      <Box size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-secondary text-xs truncate">
                        {product.name?.ar || product.name?.en || "منتج"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      product.stock <= 0 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {product.stock <= 0 ? "نفد المخزون" : `متبقي ${product.stock}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}