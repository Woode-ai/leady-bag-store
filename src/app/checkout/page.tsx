// src/app/checkout/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/Toast";
import { apiClient } from "@/lib/apiClient";
import {
  Loader2,
  Copy,
  Check,
  Gift,
  CreditCard,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

interface PaymentMethodOption {
  _id: string;
  name: {
    ar: string;
    en: string;
  };
  type: "cod" | "bank_transfer" | "other";
  instructions?: {
    ar: string;
    en: string;
  };
}

interface CartItem {
  productId: {
    _id: string;
    name: {
      ar: string;
      en: string;
    };
    price: number;
    discountPrice?: number;
    images?: string[];
  };
  quantity: number;
}

export default function CheckoutPage() {
  const { t, lang, user, authLoading, refreshCartCount } = useApp();
  const { showToast } = useToast();
  const router = useRouter();

  // الخطوات التفاعلية لإتمام الطلب (Checkout Steps: 1 -> 2 -> 3)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const [shippingAddress, setShippingAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  const [methods, setMethods] = useState<PaymentMethodOption[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [selectedMethodId, setSelectedMethodId] = useState("");

  const [useLoyalty, setUseLoyalty] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [currencyValuePerPoint, setCurrencyValuePerPoint] = useState(10);
  const [minPointsToRedeem, setMinPointsToRedeem] = useState(10);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [methodsRes, meRes, cartRes, settingsRes] = await Promise.all([
          apiClient("/payment-methods"),
          apiClient("/auth/me").catch(() => null),
          apiClient("/cart").catch(() => null),
          apiClient("/settings").catch(() => null),
        ]);

        setMethods(methodsRes?.paymentMethods || []);
        if (methodsRes?.paymentMethods?.length > 0) {
          setSelectedMethodId(methodsRes.paymentMethods[0]._id);
        }

        if (meRes?.user) {
          setUserPoints(Math.max(0, Math.floor(Number(meRes.user.loyaltyPoints || 0))));
          if (meRes.user.address) setShippingAddress(meRes.user.address);
          if (meRes.user.phone) setPhone(meRes.user.phone);
        }

        if (cartRes?.cart?.items) {
          setCartItems(cartRes.cart.items);
        }

        const settings = settingsRes?.settings;
        const pointValue = Number(settings?.currencyValuePerPoint ?? 10);
        const minimum = Number(settings?.minPointsToRedeem ?? 10);

        setCurrencyValuePerPoint(Number.isFinite(pointValue) && pointValue >= 0 ? pointValue : 10);
        setMinPointsToRedeem(Number.isFinite(minimum) && minimum >= 1 ? Math.floor(minimum) : 10);
      } catch (err) {
        console.error(err);
      } finally {
        setMethodsLoading(false);
        setCartLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const selectedMethod = methods.find((m) => m._id === selectedMethodId);

  const subtotal = cartItems.reduce((acc, item) => {
    const product = item.productId;
    if (!product) return acc;
    const price =
      product.discountPrice !== undefined &&
      product.discountPrice !== null &&
      product.discountPrice < product.price
        ? product.discountPrice
        : product.price;

    return acc + price * item.quantity;
  }, 0);

  const canUseLoyalty = currencyValuePerPoint > 0 && userPoints >= minPointsToRedeem;
  const maxPointsDiscount = userPoints * currencyValuePerPoint;
  const loyaltyDiscount = useLoyalty && canUseLoyalty ? Math.min(maxPointsDiscount, subtotal) : 0;
  const finalTotal = Math.max(0, subtotal - loyaltyDiscount);

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast(lang === "ar" ? "تم نسخ بيانات الحساب بنجاح" : "Payment details copied", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(lang === "ar" ? "تعذر نسخ البيانات" : "Could not copy details");
    }
  }

  function handleNextStep(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (currentStep === 1) {
      if (!shippingAddress.trim()) {
        setError(lang === "ar" ? "يرجى إدخال عنوان التوصيل بالتفصيل" : "Please enter the delivery address");
        return;
      }
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === 2) {
      if (!selectedMethodId) {
        setError(lang === "ar" ? "يرجى اختيار طريقة الدفع المناسبة" : "Please select a payment method");
        return;
      }
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handlePlaceOrder() {
    if (!selectedMethodId || !shippingAddress.trim()) {
      setError(lang === "ar" ? "يرجى استكمال جميع البيانات" : "Please complete all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const orderData = await apiClient("/orders", {
        method: "POST",
        body: JSON.stringify({
          shippingAddress: `${shippingAddress.trim()}${phone ? ` - هاتف: ${phone.trim()}` : ""}${
            customerNotes ? ` - ملاحظات: ${customerNotes.trim()}` : ""
          }`,
          paymentMethodId: selectedMethodId,
          useLoyaltyPoints: useLoyalty,
        }),
      });

      await refreshCartCount();
      showToast(lang === "ar" ? "تم تأكيد طلبك بنجاح!" : "Order placed successfully!", "success");
      router.push(`/order-success?orderId=${orderData.order._id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      {/* عنوان الصفحة */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-secondary">{t("checkout")}</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {lang === "ar" ? "إتمام عملية الشراء بخطوات آمنة وبسيطة" : "Complete your secure order"}
            </p>
          </div>
        </div>
      </div>

      {/* شريط التقدم خطوة بخطوة (Step-by-Step Progress Bar) */}
      <div className="mb-10 bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
        <div className="flex items-center justify-between relative">
          {/* الخط الواصل بين الدوائر */}
          <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1 bg-gray-100 -z-0">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{
                width: currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%",
              }}
            />
          </div>

          {/* الخطوة 1 */}
          <div
            onClick={() => setCurrentStep(1)}
            className="flex flex-col items-center gap-1.5 cursor-pointer relative z-10"
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                currentStep >= 1
                  ? "bg-primary text-white shadow-md shadow-primary/30 ring-4 ring-primary/15"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              1
            </div>
            <span className={`text-[11px] font-bold ${currentStep >= 1 ? "text-secondary" : "text-gray-400"}`}>
              {lang === "ar" ? "العنوان" : "Shipping"}
            </span>
          </div>

          {/* الخطوة 2 */}
          <div
            onClick={() => {
              if (shippingAddress.trim()) setCurrentStep(2);
            }}
            className="flex flex-col items-center gap-1.5 cursor-pointer relative z-10"
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                currentStep >= 2
                  ? "bg-primary text-white shadow-md shadow-primary/30 ring-4 ring-primary/15"
                  : "bg-white border-2 border-gray-200 text-gray-400"
              }`}
            >
              2
            </div>
            <span className={`text-[11px] font-bold ${currentStep >= 2 ? "text-secondary" : "text-gray-400"}`}>
              {lang === "ar" ? "الدفع والمكافآت" : "Payment"}
            </span>
          </div>

          {/* الخطوة 3 */}
          <div
            onClick={() => {
              if (shippingAddress.trim() && selectedMethodId) setCurrentStep(3);
            }}
            className="flex flex-col items-center gap-1.5 cursor-pointer relative z-10"
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                currentStep === 3
                  ? "bg-primary text-white shadow-md shadow-primary/30 ring-4 ring-primary/15"
                  : "bg-white border-2 border-gray-200 text-gray-400"
              }`}
            >
              3
            </div>
            <span className={`text-[11px] font-bold ${currentStep === 3 ? "text-secondary" : "text-gray-400"}`}>
              {lang === "ar" ? "المراجعة والتأكيد" : "Review"}
            </span>
          </div>
        </div>
      </div>

      {/* محتوى الخطوات */}
      <div>
        {/* ========================================================
            الخطوة 1: عنوان التوصيل وبيانات التواصل
            ======================================================== */}
        {currentStep === 1 && (
          <form onSubmit={handleNextStep} className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-secondary flex items-center gap-2 border-b pb-3">
                <MapPin size={18} className="text-primary" />
                <span>{lang === "ar" ? "بيانات وعنوان التوصيل" : "Delivery Address Details"}</span>
              </h2>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  {lang === "ar" ? "العنوان بالتفصيل (المدينة، الحي، الشارع، معلم مميز)" : "Detailed Address"} *
                </label>
                <textarea
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full border border-gray-200 rounded-2xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
                  rows={3}
                  placeholder={lang === "ar" ? "مثال: الخرطوم، الرياض، شارع المشتل، بالقرب من..." : "Enter your full delivery address"}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">
                    {lang === "ar" ? "رقم الهاتف للتواصل" : "Phone Number"}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09XXXXXXXX"
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">
                    {lang === "ar" ? "ملاحظات إضافية للمندوب (اختياري)" : "Delivery Notes"}
                  </label>
                  <input
                    type="text"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder={lang === "ar" ? "أي تعليمات خاصة بالتسليم" : "Any special instructions"}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 text-rose-600 text-xs p-4 rounded-2xl border border-rose-100 font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary text-white py-4 rounded-full font-bold text-sm shadow-xl shadow-primary/25 hover:bg-primary/95 transition-all flex items-center justify-center gap-2"
            >
              <span>{lang === "ar" ? "المتابعة لاختيار طريقة الدفع" : "Continue to Payment"}</span>
              {lang === "ar" ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            </button>
          </form>
        )}

        {/* ========================================================
            الخطوة 2: طريقة الدفع وبرنامج مكافآت نقاط الولاء
            ======================================================== */}
        {currentStep === 2 && (
          <form onSubmit={handleNextStep} className="space-y-6 animate-in fade-in duration-300">
            {/* بطاقة نقاط الولاء والمكافآت */}
            {userPoints > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                      <Gift size={20} />
                    </div>

                    <div>
                      <h3 className="font-bold text-secondary text-sm">
                        {lang === "ar" ? "برنامج مكافآت Leadybag" : "Leadybag Loyalty Rewards"}
                      </h3>
                      <p className="text-xs text-amber-900 mt-0.5">
                        {lang === "ar" ? "رصيدك الحالي:" : "Your balance:"} <strong>{userPoints} {lang === "ar" ? "نقطة" : "pts"}</strong> ({maxPointsDiscount} SDG)
                      </p>
                      {!canUseLoyalty && (
                        <p className="text-[11px] text-rose-600 mt-1">
                          {lang === "ar"
                            ? `تحتاج إلى ${minPointsToRedeem} نقطة على الأقل لاستبدالها بخصم.`
                            : `You need at least ${minPointsToRedeem} points to redeem.`}
                        </p>
                      )}
                    </div>
                  </div>

                  <label
                    className={`flex items-center gap-2 bg-white px-4 py-2 rounded-xl border shadow-sm ${
                      canUseLoyalty
                        ? "cursor-pointer border-amber-300 hover:border-amber-400"
                        : "cursor-not-allowed border-gray-200 opacity-60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={useLoyalty}
                      disabled={!canUseLoyalty}
                      onChange={(e) => setUseLoyalty(e.target.checked)}
                      className="rounded text-primary focus:ring-primary w-4 h-4"
                    />
                    <span className="text-xs font-bold text-secondary">
                      {lang === "ar" ? "استخدام النقاط" : "Redeem Points"}
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* اختيار طريقة الدفع */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-secondary flex items-center gap-2 border-b pb-3">
                <CreditCard size={18} className="text-primary" />
                <span>{lang === "ar" ? "طريقة الدفع في السودان" : "Select Payment Method"}</span>
              </h2>

              {methodsLoading ? (
                <div className="py-6 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin text-primary" size={16} />
                  <span>{t("loading")}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {methods.map((m) => (
                    <label
                      key={m._id}
                      className={`flex items-center justify-between border rounded-2xl p-4 cursor-pointer transition-all ${
                        selectedMethodId === m._id
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={m._id}
                          checked={selectedMethodId === m._id}
                          onChange={() => setSelectedMethodId(m._id)}
                          className="text-primary focus:ring-primary w-4 h-4"
                        />
                        <div>
                          <span className="font-bold text-sm text-secondary block">
                            {m.name[lang] || m.name.ar}
                          </span>
                          <span className="text-xs text-gray-400">
                            {m.type === "bank_transfer"
                              ? "تحويل بنكي عبر تطبيق بنكك (Bank of Khartoum)"
                              : m.type === "cod"
                              ? "الدفع عند الاستلام نقداً أو تحويل"
                              : "دفع إلكتروني مباشر"}
                          </span>
                        </div>
                      </div>

                      {m.type === "bank_transfer" && (
                        <span className="text-[10px] bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full">
                          {lang === "ar" ? "الأكثر استخداماً" : "Popular"}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}

              {/* تعليمات التحويل البنكي */}
              {selectedMethod?.type !== "cod" && selectedMethod?.instructions?.[lang] && (
                <div className="mt-4 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs text-secondary space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-500 uppercase tracking-wider">
                      {lang === "ar" ? "بيانات التحويل البنكي:" : "Bank Account Details:"}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedMethod.instructions![lang])}
                      className="flex items-center gap-1 text-primary font-bold hover:underline"
                    >
                      {copied ? (
                        <>
                          <Check size={13} className="text-emerald-600" />
                          <span>{lang === "ar" ? "تم النسخ!" : "Copied!"}</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>{lang === "ar" ? "نسخ البيانات" : "Copy"}</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="whitespace-pre-line font-mono bg-white p-3 rounded-xl border border-gray-200 text-gray-700 leading-relaxed">
                    {selectedMethod.instructions[lang]}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-rose-50 text-rose-600 text-xs p-4 rounded-2xl border border-rose-100 font-semibold">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-1/3 bg-gray-100 hover:bg-gray-200 text-secondary py-4 rounded-full font-bold text-sm transition-colors text-center"
              >
                {lang === "ar" ? "السابق" : "Back"}
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary text-white py-4 rounded-full font-bold text-sm shadow-xl shadow-primary/25 hover:bg-primary/95 transition-all flex items-center justify-center gap-2"
              >
                <span>{lang === "ar" ? "مراجعة الطلب النهائية" : "Review Order"}</span>
                {lang === "ar" ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
              </button>
            </div>
          </form>
        )}

        {/* ========================================================
            الخطوة 3: المراجعة النهائية وتأكيد الطلب
            ======================================================== */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* ملخص المنتجات والأسعار */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-secondary flex items-center gap-2 border-b pb-3">
                <ShoppingBag size={18} className="text-primary" />
                <span>{lang === "ar" ? "مراجعة المنتجات والأسعار" : "Order Summary"}</span>
              </h2>

              <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 bg-gray-100 text-gray-600 rounded-md flex items-center justify-center font-bold text-[10px]">
                        {item.quantity}x
                      </span>
                      <span className="font-semibold text-secondary">
                        {item.productId?.name?.[lang] || item.productId?.name?.ar}
                      </span>
                    </div>
                    <span className="font-bold text-secondary">
                      {(item.productId?.discountPrice || item.productId?.price) * item.quantity} SDG
                    </span>
                  </div>
                ))}
              </div>

              {/* تفاصيل الحساب */}
              <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>{lang === "ar" ? "المجموع الفرعي:" : "Subtotal:"}</span>
                  <span className="font-semibold">{subtotal} SDG</span>
                </div>
                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-amber-600 font-bold">
                    <span>{lang === "ar" ? "خصم نقاط الولاء:" : "Loyalty Discount:"}</span>
                    <span>-{loyaltyDiscount} SDG</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-secondary pt-2 border-t border-gray-200">
                  <span>{lang === "ar" ? "المبلغ الكلي للدفع:" : "Total Payable:"}</span>
                  <span className="text-primary text-lg font-black">{finalTotal} SDG</span>
                </div>
              </div>
            </div>

            {/* ملخص العنوان وطريقة الدفع */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-3 text-xs">
              <div className="flex justify-between items-start pb-2 border-b border-gray-50">
                <span className="text-gray-400 font-bold">{lang === "ar" ? "العنوان المختار:" : "Address:"}</span>
                <span className="font-bold text-secondary text-end max-w-[240px]">{shippingAddress}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-bold">{lang === "ar" ? "طريقة الدفع:" : "Payment:"}</span>
                <span className="font-bold text-primary">{selectedMethod?.name?.[lang] || selectedMethod?.name?.ar}</span>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 text-rose-600 text-xs p-4 rounded-2xl border border-rose-100 font-semibold">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-1/3 bg-gray-100 hover:bg-gray-200 text-secondary py-4 rounded-full font-bold text-sm transition-colors text-center"
              >
                {lang === "ar" ? "تعديل" : "Edit"}
              </button>
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={loading}
                className="flex-1 bg-primary text-white py-4 rounded-full font-extrabold text-sm shadow-xl shadow-primary/25 hover:bg-primary/95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>{lang === "ar" ? "جاري إنشاء وتأكيد الطلب..." : "Placing Order..."}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>{t("placeOrder")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}