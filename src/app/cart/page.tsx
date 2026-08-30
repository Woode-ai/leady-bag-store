// src/app/cart/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { apiClient } from "@/lib/apiClient";
import { Trash2, Tag, X, Sparkles } from "lucide-react";

export default function CartPage() {
  const { t, lang, user, refreshCartCount } = useApp();
  const [cart, setCart] = useState<any>(null);
  const [couponData, setCouponData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [couponInput, setCouponInput] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    if (user) loadCart();
    else setLoading(false);
  }, [user]);

  async function loadCart() {
    setLoading(true);
    try {
      const data = await apiClient("/cart");
      setCart(data.cart);
      setCouponData(data.coupon || null);
      if (data.cart?.couponCode) {
        setCouponInput(data.cart.couponCode);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateQuantity(productId: string, quantity: number) {
    if (quantity < 1) return;
    try {
      const data = await apiClient("/cart", {
        method: "PUT",
        body: JSON.stringify({ productId, quantity }),
      });
      setCart(data.cart);
      await refreshCartCount();
    } catch (err: unknown) {
      alert((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    }
  }

  async function removeItem(productId: string) {
    try {
      const data = await apiClient(`/cart?productId=${productId}`, { method: "DELETE" });
      setCart(data.cart);
      await refreshCartCount();
    } catch (err: unknown) {
      alert((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    }
  }

  async function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    setCouponError("");
    try {
      const data = await apiClient("/cart/coupon", {
        method: "POST",
        body: JSON.stringify({ code: couponInput }),
      });
      setCart(data.cart);
      setCouponData(data.coupon);
    } catch (err: unknown) {
      setCouponError((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    } finally {
      setApplyingCoupon(false);
    }
  }

  async function removeCoupon() {
    setApplyingCoupon(true);
    try {
      const data = await apiClient("/cart/coupon", { method: "DELETE" });
      setCart(data.cart);
      setCouponData(null);
      setCouponInput("");
      setCouponError("");
    } catch (err: unknown) {
      setCouponError((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    } finally {
      setApplyingCoupon(false);
    }
  }

  if (!user) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">
          {lang === "ar" ? "يجب تسجيل الدخول لعرض السلة" : "Please login to view your cart"}
        </p>
        <Link href="/login" className="bg-primary text-white px-6 py-2.5 rounded-full font-medium shadow-md shadow-primary/20">
          {t("login")}
        </Link>
      </main>
    );
  }

  if (loading) {
    return <p className="text-center py-16 text-gray-400">{t("loading")}</p>;
  }

  const items = cart?.items || [];

  // حساب المجموع الفرعي بناءً على السعر الحالي لكل منتج
  const subtotal = items.reduce((sum: number, item: any) => {
    if (!item.productId) return sum;
    const price = item.productId.discountPrice || item.productId.price || 0;
    return sum + price * item.quantity;
  }, 0);

  // حساب قيمة الخصم بناءً على الكوبون
  let discountAmount = 0;
  if (couponData && subtotal > 0) {
    if (couponData.discountType === "percentage") {
      discountAmount = Math.round((subtotal * couponData.value) / 100);
    } else {
      discountAmount = Math.min(couponData.value, subtotal);
    }
  }
  const finalTotal = Math.max(0, subtotal - discountAmount);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="text-primary" size={24} />
        <h1 className="text-2xl font-bold text-secondary">{t("yourCart")}</h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-gray-50/60 rounded-3xl border border-gray-100 p-8">
          <p className="text-gray-400 text-lg mb-4">{t("emptyCart")}</p>
          <Link href="/products" className="bg-primary text-white px-8 py-3 rounded-full font-medium inline-block shadow-lg shadow-primary/20 hover:scale-105 transition-all">
            {t("shopNow")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* عناصر السلة */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item: any) => {
              if (!item.productId) return null;
              return (
                <div
                  key={item.productId._id}
                  className="flex gap-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-24 h-24 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                    {item.productId.images?.[0] ? (
                      <img
                        src={item.productId.images[0]}
                        alt={item.productId.name?.[lang] || "Product"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-secondary text-base">{item.productId.name?.[lang]}</h3>
                      <p className="text-primary font-bold text-lg mt-1">
                        {item.productId.discountPrice || item.productId.price} <span className="text-xs text-gray-500 font-normal">SDG</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-2 py-1">
                        <button
                          onClick={() => updateQuantity(item.productId._id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-primary transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId._id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-primary transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.productId._id)}
                        className="text-gray-400 hover:text-red-500 p-1.5 transition-colors"
                        title={t("remove")}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ملخص الطلب */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm h-fit space-y-6">
            <h2 className="font-bold text-secondary text-lg border-b pb-3">{lang === "ar" ? "ملخص الطلب" : "Order Summary"}</h2>

            {/* إدخال الكوبون */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {t("couponCode")}
              </label>
              {cart?.couponCode && couponData ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-xl text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Tag size={16} />
                    <span>{cart.couponCode}</span>
                    <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">
                      {couponData.discountType === "percentage" ? `-${couponData.value}%` : `-${couponData.value} SDG`}
                    </span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    disabled={applyingCoupon}
                    className="text-green-600 hover:text-red-500 p-1 transition-colors"
                    title={lang === "ar" ? "إلغاء الكوبون" : "Remove coupon"}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <form onSubmit={applyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={lang === "ar" ? "ادخلي الكود..." : "Enter code..."}
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary uppercase"
                  />
                  <button
                    type="submit"
                    disabled={applyingCoupon || !couponInput.trim()}
                    className="bg-secondary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary/90 disabled:opacity-50 transition-colors"
                  >
                    {applyingCoupon ? "..." : t("applyCoupon")}
                  </button>
                </form>
              )}
              {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}
            </div>

            {/* تفاصيل الأسعار والحساب */}
            <div className="space-y-3 pt-4 border-t border-gray-100 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>{t("subtotal")}</span>
                <span className="font-semibold">{subtotal} SDG</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span className="flex items-center gap-1">
                    <Tag size={14} /> {t("discount")}
                  </span>
                  <span>-{discountAmount} SDG</span>
                </div>
              )}

              <div className="flex justify-between text-base font-bold text-secondary pt-3 border-t border-gray-200">
                <span>{t("total")}</span>
                <span className="text-primary text-xl font-extrabold">{finalTotal} SDG</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="block w-full text-center bg-primary text-white py-3.5 rounded-full font-semibold shadow-lg shadow-primary/25 hover:bg-primary/95 transition-all"
            >
              {t("checkout")}
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}


