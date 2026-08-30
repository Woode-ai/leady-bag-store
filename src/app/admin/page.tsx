// src/app/admin/page.tsx

"use client";

import { useEffect, useState } from "react";
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
  return new Intl.NumberFormat("ar-SD").format(
    Number(value) || 0
  );
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
    default:
      "bg-primary/10 text-primary",

    success:
      "bg-emerald-50 text-emerald-600",

    warning:
      "bg-amber-50 text-amber-600",

    danger:
      "bg-rose-50 text-rose-600",
  };

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-gray-400 font-medium">
            {title}
          </p>

          <div className="flex items-end gap-1.5 mt-2">
            <span className="text-2xl font-black text-secondary">
              {value}
            </span>

            {suffix && (
              <span className="text-[10px] text-gray-400 mb-1">
                {suffix}
              </span>
            )}
          </div>

          {description && (
            <p className="text-[11px] text-gray-400 mt-2">
              {description}
            </p>
          )}
        </div>

        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center ${styles[type]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] =
    useState<Analytics | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadAnalytics() {
    setLoading(true);
    setError("");

    try {
      const data = await apiClient("/analytics");

      if (!data?.analytics) {
        throw new Error(
          data?.message ||
            "تعذر تحميل الإحصائيات"
        );
      }

      setAnalytics(data.analytics);
    } catch (err: unknown) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحميل الإحصائيات"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div
        dir="rtl"
        className="min-h-[60vh] flex items-center justify-center"
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />

          <p className="text-gray-400 text-sm mt-4">
            جاري تحميل لوحة التحكم...
          </p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div
        dir="rtl"
        className="min-h-[60vh] flex items-center justify-center px-4"
      >
        <div className="bg-white border border-rose-100 rounded-3xl p-8 text-center max-w-md w-full shadow-sm">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <XCircle size={28} />
          </div>

          <h2 className="font-bold text-secondary mt-4">
            تعذر تحميل الإحصائيات
          </h2>

          <p className="text-sm text-gray-400 mt-2">
            {error || "حدث خطأ غير معروف"}
          </p>

          <button
            onClick={loadAnalytics}
            className="mt-5 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
          >
            <RefreshCw size={16} />
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const maxSale = Math.max(
    ...analytics.last7Days.map(
      (day) => day.sales
    ),
    1
  );

  return (
    <main
      dir="rtl"
      className="space-y-8 pb-10"
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <BarChart3 size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-black text-secondary">
                لوحة القيادة
              </h1>

              <p className="text-xs text-gray-400 mt-0.5">
                نظرة شاملة على أداء متجر Leadybag
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadAnalytics}
          className="self-start md:self-auto flex items-center gap-2 bg-white border border-gray-200 text-secondary px-4 py-2.5 rounded-xl text-xs font-semibold hover:border-primary/30 hover:text-primary transition-all"
        >
          <RefreshCw size={15} />
          تحديث البيانات
        </button>
      </div>

      {/* =====================================================
          MAIN STATISTICS
      ====================================================== */}

      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="إجمالي المبيعات"
            value={formatMoney(
              analytics.totalRevenue
            )}
            icon={
              <CircleDollarSign size={21} />
            }
            description="قيمة الطلبات المدفوعة والصالحة"
          />

          <StatCard
            title="تكلفة المشتريات"
            value={formatMoney(
              analytics.totalCost
            )}
            icon={
              <ShoppingBag size={21} />
            }
            description="تكلفة المنتجات التي تم بيعها"
            type="warning"
          />

          <StatCard
            title="صافي الربح"
            value={formatMoney(
              analytics.totalProfit
            )}
            icon={
              <TrendingUp size={21} />
            }
            description={`هامش الربح ${formatNumber(
              analytics.profitMargin
            )}%`}
            type="success"
          />

          <StatCard
            title="متوسط قيمة الطلب"
            value={formatMoney(
              analytics.averageOrderValue
            )}
            icon={
              <Wallet size={21} />
            }
            description="متوسط قيمة الطلب الواحد"
          />
        </div>
      </section>

      {/* =====================================================
          SECONDARY STATISTICS
      ====================================================== */}

      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="الطلبات"
            value={formatNumber(
              analytics.totalOrders
            )}
            suffix="طلب"
            icon={
              <Package size={20} />
            }
          />

          <StatCard
            title="القطع المباعة"
            value={formatNumber(
              analytics.totalItemsSold
            )}
            suffix="قطعة"
            icon={
              <Box size={20} />
            }
          />

          <StatCard
            title="المنتجات"
            value={formatNumber(
              analytics.totalProducts
            )}
            suffix="منتج"
            icon={
              <ShoppingBag size={20} />
            }
          />

          <StatCard
            title="الخصومات"
            value={formatMoney(
              analytics.totalDiscount
            )}
            icon={
              <Calculator size={20} />
            }
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
              بعض المنتجات لا تحتوي على سعر شراء
            </h3>

            <p className="text-xs text-amber-700 mt-1 leading-6">
              يوجد{" "}
              <strong>
                {formatNumber(
                  analytics.productsWithoutCost
                )}
              </strong>{" "}
              منتجاً بدون تكلفة شراء. أدخل سعر الشراء لكل منتج حتى يتم حساب الأرباح بشكل دقيق.
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          SALES CHART
      ====================================================== */}

      <section className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-7">
          <div>
            <h2 className="font-black text-secondary text-lg flex items-center gap-2">
              <BarChart3
                size={19}
                className="text-primary"
              />
              المبيعات خلال آخر 7 أيام
            </h2>

            <p className="text-xs text-gray-400 mt-1">
              إجمالي قيمة المبيعات اليومية
            </p>
          </div>

          <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-bold">
            {formatMoney(
              analytics.last7Days.reduce(
                (sum, day) =>
                  sum + day.sales,
                0
              )
            )}{" "}
            SDG
          </div>
        </div>

        <div className="h-64 flex items-end gap-2 md:gap-4">
          {analytics.last7Days.map(
            (day) => {
              const percentage =
                (day.sales /
                  maxSale) *
                100;

              const height =
                day.sales > 0
                  ? Math.max(
                      percentage,
                      6
                    )
                  : 3;

              const date =
                new Date(
                  `${day.date}T00:00:00`
                );

              const label =
                date.toLocaleDateString(
                  "ar-SD",
                  {
                    weekday: "short",
                  }
                );

              return (
                <div
                  key={day.date}
                  className="flex-1 h-full flex flex-col items-center justify-end gap-2 min-w-0"
                >
                  <div className="text-[9px] md:text-[10px] text-gray-400 truncate">
                    {formatMoney(
                      day.sales
                    )}
                  </div>

                  <div className="w-full max-w-12 h-48 flex items-end">
                    <div
                      className="w-full bg-primary rounded-t-xl hover:opacity-80 transition-all"
                      style={{
                        height: `${height}%`,
                      }}
                      title={`${formatMoney(
                        day.sales
                      )} SDG`}
                    />
                  </div>

                  <div className="text-[10px] md:text-xs font-semibold text-gray-500">
                    {label}
                  </div>

                  <div className="text-[9px] text-gray-400">
                    {day.date.slice(5)}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </section>

      {/* =====================================================
          TOP PRODUCTS + LOW STOCK
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TOP PRODUCTS */}

        <section className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-black text-secondary text-lg">
                الأكثر مبيعاً
              </h2>

              <p className="text-xs text-gray-400 mt-1">
                أفضل المنتجات حسب عدد القطع
              </p>
            </div>

            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <TrendingUp size={19} />
            </div>
          </div>

          {analytics.topProducts.length ===
          0 ? (
            <div className="py-12 text-center">
              <ShoppingBag
                size={30}
                className="mx-auto text-gray-200"
              />

              <p className="text-gray-400 text-sm mt-3">
                لا توجد بيانات مبيعات بعد
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.topProducts.map(
                (product, index) => (
                  <div
                    key={`${product.name}-${index}`}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/70 border border-gray-100"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center font-black text-primary text-sm">
                      {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-secondary text-sm truncate">
                        {product.name}
                      </p>

                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatNumber(
                          product.count
                        )}{" "}
                        قطعة
                      </p>
                    </div>

                    <div className="text-left">
                      <p className="text-primary font-black text-sm">
                        {formatMoney(
                          product.revenue
                        )}
                      </p>

                      <p className="text-[9px] text-gray-400">
                        SDG
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* LOW STOCK */}

        <section className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-black text-secondary text-lg">
                تنبيهات المخزون
              </h2>

              <p className="text-xs text-gray-400 mt-1">
                المنتجات التي أوشكت على النفاد
              </p>
            </div>

            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <AlertTriangle size={19} />
            </div>
          </div>

          {analytics.lowStockProducts.length ===
          0 ? (
            <div className="py-12 text-center">
              <Box
                size={30}
                className="mx-auto text-gray-200"
              />

              <p className="text-gray-400 text-sm mt-3">
                المخزون بحالة جيدة
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.lowStockProducts
                .slice(0, 8)
                .map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-gray-50/70 border border-gray-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                        <Box size={17} />
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-secondary text-sm truncate">
                          {product.name?.ar ||
                            product.name?.en ||
                            "منتج"}
                        </p>

                        <p className="text-[10px] text-gray-400 mt-1">
                          يحتاج إلى إعادة تخزين
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-full ${
                        product.stock <=
                        0
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {product.stock <=
                      0
                        ? "نفد"
                        : `متبقي ${product.stock}`}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </section>
      </div>

      {/* =====================================================
          ORDER STATUS
      ====================================================== */}

      <section>
        <h2 className="font-black text-secondary text-lg mb-4">
          حالة الطلبات
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={19} />
              </div>

              <div>
                <p className="text-xs text-gray-400">
                  طلبات قيد المعالجة
                </p>

                <p className="text-xl font-black text-secondary mt-1">
                  {formatNumber(
                    analytics.pendingOrders
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <XCircle size={19} />
              </div>

              <div>
                <p className="text-xs text-gray-400">
                  الطلبات الملغاة
                </p>

                <p className="text-xl font-black text-secondary mt-1">
                  {formatNumber(
                    analytics.cancelledOrders
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ArrowDownRight size={19} />
              </div>

              <div>
                <p className="text-xs text-gray-400">
                  الطلبات المسترجعة
                </p>

                <p className="text-xl font-black text-secondary mt-1">
                  {formatNumber(
                    analytics.returnedOrders
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PROFIT SUMMARY
      ====================================================== */}

      <section className="bg-secondary rounded-3xl p-6 md:p-8 text-white overflow-hidden relative">
        <div className="absolute -left-20 -top-20 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute -right-20 -bottom-20 w-56 h-56 rounded-full bg-white/5" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center">
              <TrendingUp size={22} />
            </div>

            <div>
              <h2 className="font-black text-lg">
                ملخص الأداء المالي
              </h2>

              <p className="text-white/50 text-xs mt-1">
                المبيعات مقابل تكلفة المنتجات والربح
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <p className="text-white/50 text-xs">
                المبيعات
              </p>

              <p className="text-2xl font-black mt-1">
                {formatMoney(
                  analytics.totalRevenue
                )}{" "}
                <span className="text-xs font-normal">
                  SDG
                </span>
              </p>
            </div>

            <div>
              <p className="text-white/50 text-xs">
                تكلفة المشتريات
              </p>

              <p className="text-2xl font-black mt-1">
                {formatMoney(
                  analytics.totalCost
                )}{" "}
                <span className="text-xs font-normal">
                  SDG
                </span>
              </p>
            </div>

            <div>
              <p className="text-white/50 text-xs">
                الربح
              </p>

              <p className="text-2xl font-black mt-1 text-emerald-300">
                {formatMoney(
                  analytics.totalProfit
                )}{" "}
                <span className="text-xs font-normal text-white">
                  SDG
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}