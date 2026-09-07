// src/app/cart/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/Toast";
import { apiClient } from "@/lib/apiClient";
import { Trash2, Tag, X, Sparkles, ShoppingBag, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

export default function CartPage() {
  const { t, lang, user, refreshCartCount, cartCount } = useApp();
  const { showToast } = useToast();
  const [cart, setCart] = useState<any>(null);
  const [couponData, setCouponData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [couponInput, setCouponInput] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    if (user) loadCart();
    else loadGuestCart();
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

  // دعم السلة المحلية للزوار غير المسجلين
  async function loadGuestCart() {
    setLoading(true);
    try {
      const saved = localStorage.getItem("leadybag_local_cart");
      if (!saved) {
        setCart({ items: [] });
        setLoading(false);
        return;
      }
      const localItems: { productId: string; quantity: number }[] = JSON.parse(saved);
      if (localItems.length === 0) {
        setCart({ items: [] });
        setLoading(false);
        return;
      }

      // جلب بيانات المنتجات
      const loadedItems = await Promise.all(
        localItems.map(async (item) => {
          try {
            const data = await apiClient(`/products/${item.productId}`);
            return {
              productId: data.product,
              quantity: item.quantity,
            };
          } catch {
            return null;
          }
        })
      );

      setCart({ items: loadedItems.filter(Boolean) });
    } catch (e) {
      setCart({ items: [] });
    } finally {
      setLoading(false);
    }
  }

  async function updateQuantity(productId: string, quantity: number) {
    if (quantity < 1) return;
    if (user) {
      try {
        const data = await apiClient("/cart", {
          method: "PUT",
          body: JSON.stringify({ productId, quantity }),
        });
        setCart(data.cart);
        await refreshCartCount();
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : String(err), "error");
      }
    } else {
      // Local cart update
      const saved = localStorage.getItem("leadybag_local_cart");
      if (saved) {
        const items = JSON.parse(saved);
        const target = items.find((i: any) => i.productId === productId);
        if (target) {
          target.quantity = quantity;
          localStorage.setItem("leadybag_local_cart", JSON.stringify(items));
          loadGuestCart();
          refreshCartCount();
        }
      }
    }
  }

  async function removeItem(productId: string) {
    if (user) {
      try {
        const data = await apiClient(`/cart?productId=${productId}`, { method: "DELETE" });
        setCart(data.cart);
        await refreshCartCount();
        showToast(lang === "ar" ? "تمت إزالة المنتج من السلة" : "Item removed from cart", "info");
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : String(err), "error");
      }
    } else {
      const saved = localStorage.getItem("leadybag_local_cart");
      if (saved) {
        const items = JSON.parse(saved).filter((i: any) => i.productId !== productId);
        localStorage.setItem("leadybag_local_cart", JSON.stringify(items));
        loadGuestCart();
        refreshCartCount();
        showToast(lang === "ar" ? "تمت إزالة المنتج من السلة" : "Item removed from cart", "info");
      }
    }
  }

  async function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!couponInput.trim()) return;
    if (!user) {
      showToast(lang === "ar" ? "يرجى تسجيل الدخول أولاً لتطبيق الكوبون" : "Please login to apply coupons", "warning");
      return;
    }
    setApplyingCoupon(true);
    setCouponError("");
    try {
      const data = await apiClient("/cart/coupon", {
        method: "POST",
        body: JSON.stringify({ code: couponInput }),
      });
      setCart(data.cart);
      setCouponData(data.coupon);
      showToast(lang === "ar" ? "تم تطبيق كود الخصم بنجاح!" : "Coupon applied successfully!", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCouponError(msg);
      showToast(msg, "error");
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
      showToast(lang === "ar" ? "تم إلغاء الكوبون" : "Coupon removed", "info");
    } catch (err: unknown) {
      setCouponError(err instanceof Error ? err.message : String(err));
    } finally {
      setApplyingCoupon(false);
    }
  }

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
          <div className="h-6 w-36 bg-gray-100 rounded-md animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-3xl p-4 flex gap-4 animate-pulse">
                <div className="w-24 h-24 bg-gray-100 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2 py-2">
                  <div className="h-4 bg-gray-100 rounded-md w-2/3" />
                  <div className="h-4 bg-gray-100 rounded-md w-1/4" />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white border border-gray-100 rounded-3xl p-6 h-64 animate-pulse" />
        </div>
      </main>
    );
  }

  const items = cart?.items || [];

  const subtotal = items.reduce((sum: number, item: any) => {
    if (!item.productId) return sum;
    const price = item.productId.discountPrice || item.productId.price || 0;
    return sum + price * item.quantity;
  }, 0);

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
        <h1 className="text-2xl font-extrabold text-secondary">{t("yourCart")}</h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-gray-50/60 rounded-3xl border border-gray-100 p-8">
          <ShoppingBag className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-secondary font-bold text-lg mb-2">{t("emptyCart")}</p>
          <p className="text-gray-400 text-xs mb-6 max-w-sm mx-auto">
            {lang === "ar"
              ? "سلتك لا تحتوي على أي منتجات حالياً. استكشفي متجرنا واختاري ما يناسبك!"
              : "Your cart is currently empty. Explore our collection and add your favorite bags!"}
          </p>
          <Link
            href="/products"
            className="bg-primary text-white px-8 py-3.5 rounded-full font-bold text-xs inline-block shadow-lg shadow-primary/25 hover:scale-105 transition-all"
          >
            {t("shopNow")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* عناصر السلة */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item: any) => {
              if (!item.productId) return null;
              const product = item.productId;
              return (
                <div
                  key={product._id}
                  className="flex gap-4 bg-white border border-gray-100 rounded-3xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name?.[lang] || product.name?.ar || "Product"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-secondary text-sm">
                        {product.name?.[lang] || product.name?.ar}
                      </h3>
                      <p className="text-primary font-black text-base mt-1">
                        {product.discountPrice || product.price} <span className="text-xs text-gray-400 font-normal">SDG</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-2 py-1">
                        <button
                          onClick={() => updateQuantity(product._id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-primary font-bold text-sm transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-secondary">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(product._id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-primary font-bold text-sm transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(product._id)}
                        className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        title={t("remove")}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ملخص الطلب والكوبون */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm h-fit space-y-6">
            <h2 className="font-extrabold text-secondary text-base border-b pb-3">
              {lang === "ar" ? "ملخص السلة" : "Cart Summary"}
            </h2>

            {/* إدخال الكوبون */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {t("couponCode")}
              </label>
              {cart?.couponCode && couponData ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-2xl text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <Tag size={15} />
                    <span>{cart.couponCode}</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                      {couponData.discountType === "percentage" ? `-${couponData.value}%` : `-${couponData.value} SDG`}
                    </span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    disabled={applyingCoupon}
                    className="text-emerald-700 hover:text-rose-600 p-1 transition-colors"
                    title={lang === "ar" ? "إلغاء الكوبون" : "Remove coupon"}
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <form onSubmit={applyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={lang === "ar" ? "ادخلي رمز الكوبون..." : "Coupon code..."}
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 border border-gray-200 rounded-2xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary uppercase font-mono"
                  />
                  <button
                    type="submit"
                    disabled={applyingCoupon || !couponInput.trim()}
                    className="bg-secondary text-white px-4 py-2 rounded-2xl text-xs font-bold hover:bg-secondary/90 disabled:opacity-50 transition-colors"
                  >
                    {applyingCoupon ? "..." : t("applyCoupon")}
                  </button>
                </form>
              )}
              {couponError && <p className="text-rose-500 text-[11px] font-semibold mt-2">{couponError}</p>}
            </div>

            {/* تفاصيل الأسعار والحساب */}
            <div className="space-y-2.5 pt-4 border-t border-gray-100 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>{t("subtotal")}</span>
                <span className="font-bold text-secondary">{subtotal} SDG</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span className="flex items-center gap-1">
                    <Tag size={13} /> {t("discount")}
                  </span>
                  <span>-{discountAmount} SDG</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black text-secondary pt-3 border-t border-gray-200">
                <span>{t("total")}</span>
                <span className="text-primary text-xl font-black">{finalTotal} SDG</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="block w-full text-center bg-primary text-white py-4 rounded-full font-bold text-sm shadow-xl shadow-primary/25 hover:bg-primary/95 transition-all"
            >
              {t("checkout")}
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
