// src/app/checkout/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { apiClient } from "@/lib/apiClient";
import {
  Loader2,
  Copy,
  Check,
  Gift,
  CreditCard,
  ShieldCheck,
} from "lucide-react";

interface PaymentMethodOption {
  _id: string;
  name: {
    ar: string;
    en: string;
  };
  type:
    | "cod"
    | "bank_transfer"
    | "other";
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

interface StoreSettings {
  currencyValuePerPoint: number;
  minPointsToRedeem: number;
}

export default function CheckoutPage() {
  const {
    t,
    lang,
    user,
    authLoading,
    refreshCartCount,
  } = useApp();

  const router = useRouter();

  const [shippingAddress, setShippingAddress] =
    useState("");

  const [methods, setMethods] =
    useState<PaymentMethodOption[]>([]);

  const [methodsLoading, setMethodsLoading] =
    useState(true);

  const [selectedMethodId, setSelectedMethodId] =
    useState("");

  const [useLoyalty, setUseLoyalty] =
    useState(false);

  const [userPoints, setUserPoints] =
    useState(0);

  const [
    currencyValuePerPoint,
    setCurrencyValuePerPoint,
  ] = useState(10);

  const [
    minPointsToRedeem,
    setMinPointsToRedeem,
  ] = useState(10);

  const [cartItems, setCartItems] =
    useState<CartItem[]>([]);

  const [cartLoading, setCartLoading] =
    useState(true);

  const [copied, setCopied] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * ============================================================
   * تحميل البيانات
   * ============================================================
   */

  useEffect(() => {
    async function loadData() {
      try {
        const [
          methodsRes,
          meRes,
          cartRes,
          settingsRes,
        ] = await Promise.all([
          apiClient("/payment-methods"),

          apiClient("/auth/me").catch(
            () => null
          ),

          apiClient("/cart").catch(
            () => null
          ),

          apiClient("/settings").catch(
            () => null
          ),
        ]);

        /*
         * طرق الدفع
         */
        setMethods(
          methodsRes?.paymentMethods || []
        );

        if (
          methodsRes?.paymentMethods
            ?.length > 0
        ) {
          setSelectedMethodId(
            methodsRes.paymentMethods[0]
              ._id
          );
        }

        /*
         * نقاط العميل
         */
        if (meRes?.user) {
          setUserPoints(
            Math.max(
              0,
              Math.floor(
                Number(
                  meRes.user
                    .loyaltyPoints || 0
                )
              )
            )
          );
        }

        /*
         * السلة
         */
        if (cartRes?.cart?.items) {
          setCartItems(
            cartRes.cart.items
          );
        }

        /*
         * إعدادات النقاط
         */
        const settings =
          settingsRes?.settings;

        const pointValue = Number(
          settings
            ?.currencyValuePerPoint ??
            10
        );

        const minimum = Number(
          settings
            ?.minPointsToRedeem ??
            10
        );

        setCurrencyValuePerPoint(
          Number.isFinite(pointValue) &&
            pointValue >= 0
            ? pointValue
            : 10
        );

        setMinPointsToRedeem(
          Number.isFinite(minimum) &&
            minimum >= 1
            ? Math.floor(minimum)
            : 10
        );
      } catch (err) {
        console.error(err);
      } finally {
        setMethodsLoading(false);
        setCartLoading(false);
      }
    }

    loadData();
  }, []);

  /*
   * ============================================================
   * حماية الصفحة
   * ============================================================
   */

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [
    authLoading,
    user,
    router,
  ]);

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2
          className="h-8 w-8 animate-spin"
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  /*
   * ============================================================
   * الحسابات
   * ============================================================
   */

  const selectedMethod =
    methods.find(
      (m) =>
        m._id === selectedMethodId
    );

  const subtotal =
    cartItems.reduce(
      (acc, item) => {
        const product =
          item.productId;

        const price =
          product.discountPrice !==
            undefined &&
          product.discountPrice !==
            null &&
          product.discountPrice <
            product.price
            ? product.discountPrice
            : product.price;

        return (
          acc +
          price * item.quantity
        );
      },
      0
    );

  const canUseLoyalty =
    currencyValuePerPoint > 0 &&
    userPoints >=
      minPointsToRedeem;

  const maxPointsDiscount =
    userPoints *
    currencyValuePerPoint;

  const loyaltyDiscount =
    useLoyalty && canUseLoyalty
      ? Math.min(
          maxPointsDiscount,
          subtotal
        )
      : 0;

  const finalTotal =
    Math.max(
      0,
      subtotal -
        loyaltyDiscount
    );

  /*
   * ============================================================
   * نسخ تعليمات الدفع
   * ============================================================
   */

  async function copyToClipboard(
    text: string
  ) {
    try {
      await navigator.clipboard.writeText(
        text
      );

      setCopied(true);

      setTimeout(
        () => setCopied(false),
        2000
      );
    } catch {
      setError(
        lang === "ar"
          ? "تعذر نسخ البيانات"
          : "Could not copy the payment details"
      );
    }
  }

  /*
   * ============================================================
   * إنشاء الطلب
   * ============================================================
   */

  async function handlePlaceOrder(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!selectedMethodId) {
      setError(
        lang === "ar"
          ? "يرجى اختيار طريقة الدفع"
          : "Please choose a payment method"
      );
      return;
    }

    if (!shippingAddress.trim()) {
      setError(
        lang === "ar"
          ? "يرجى إدخال عنوان التوصيل"
          : "Please enter the shipping address"
      );
      return;
    }

    /*
     * حماية إضافية في الواجهة.
     *
     * الـ Backend هو صاحب القرار النهائي
     * على أي حال.
     */
    if (
      useLoyalty &&
      !canUseLoyalty
    ) {
      setError(
        lang === "ar"
          ? `تحتاج إلى ${minPointsToRedeem} نقطة على الأقل لاستخدام نقاط الولاء`
          : `You need at least ${minPointsToRedeem} points to use loyalty points`
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const orderData =
        await apiClient(
          "/orders",
          {
            method: "POST",
            body: JSON.stringify({
              shippingAddress:
                shippingAddress.trim(),

              paymentMethodId:
                selectedMethodId,

              useLoyaltyPoints:
                useLoyalty,
            }),
          }
        );

      await refreshCartCount();

      router.push(
        `/order-success?orderId=${orderData.order._id}`
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : String(err)
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-8">
        <ShieldCheck
          className="text-primary"
          size={28}
        />

        <h1 className="text-2xl md:text-3xl font-bold text-secondary">
          {t("checkout")}
        </h1>
      </div>

      <form
        onSubmit={handlePlaceOrder}
        className="space-y-8"
      >
        {/* =====================================================
            ملخص السلة
            ===================================================== */}

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-secondary mb-4">
            ملخص السلة والأسعار
          </h2>

          {cartLoading ? (
            <p className="text-sm text-gray-400">
              جاري تحميل تفاصيل السلة...
            </p>
          ) : cartItems.length === 0 ? (
            <p className="text-sm text-red-500">
              السلة فارغة
            </p>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>
                  المجموع الفرعي للمنتجات:
                </span>

                <span className="font-semibold text-secondary">
                  {subtotal} SDG
                </span>
              </div>

              {useLoyalty &&
                loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-amber-600 font-medium">
                    <span>
                      خصم نقاط الولاء:
                    </span>

                    <span>
                      -{" "}
                      {loyaltyDiscount}{" "}
                      SDG
                    </span>
                  </div>
                )}

              <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-bold text-secondary">
                <span>
                  الإجمالي النهائي للدفع:
                </span>

                <span className="text-primary">
                  {finalTotal} SDG
                </span>
              </div>
            </div>
          )}
        </div>

        {/* =====================================================
            العنوان
            ===================================================== */}

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <label className="block text-sm font-bold text-secondary mb-2">
            {t("shippingAddress")}{" "}
            (المدينة / الحي / الشارع)
          </label>

          <textarea
            required
            value={shippingAddress}
            onChange={(e) =>
              setShippingAddress(
                e.target.value
              )
            }
            className="w-full border border-gray-200 rounded-2xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            rows={3}
            placeholder="الخرطوم، الرياض، شارع المشتل، معلم بارز..."
          />
        </div>

        {/* =====================================================
            نقاط الولاء
            ===================================================== */}

        {userPoints > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center shrink-0">
                  <Gift size={20} />
                </div>

                <div>
                  <h3 className="font-bold text-secondary text-sm">
                    برنامج مكافآت Leadybag
                  </h3>

                  <p className="text-xs text-amber-900 mt-0.5">
                    رصيدك الحالي:{" "}
                    <strong>
                      {userPoints} نقطة
                    </strong>
                  </p>

                  <p className="text-xs text-amber-800 mt-1">
                    قيمة النقاط:{" "}
                    <strong>
                      {maxPointsDiscount}{" "}
                      SDG
                    </strong>
                  </p>

                  {!canUseLoyalty && (
                    <p className="text-[11px] text-red-600 mt-1">
                      تحتاج إلى{" "}
                      {minPointsToRedeem}{" "}
                      نقطة على الأقل
                      لاستخدامها.
                    </p>
                  )}
                </div>
              </div>

              <label
                className={`flex items-center gap-2 bg-white px-4 py-2 rounded-xl border shadow-sm ${
                  canUseLoyalty
                    ? "cursor-pointer border-amber-300"
                    : "cursor-not-allowed border-gray-200 opacity-60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={useLoyalty}
                  disabled={
                    !canUseLoyalty
                  }
                  onChange={(e) =>
                    setUseLoyalty(
                      e.target.checked
                    )
                  }
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />

                <span className="text-xs font-bold text-secondary">
                  استخدام النقاط
                </span>
              </label>
            </div>
          </div>
        )}

        {/* =====================================================
            طرق الدفع
            ===================================================== */}

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <label className="text-sm font-bold text-secondary mb-4 flex items-center gap-2">
            <CreditCard
              size={18}
              className="text-primary"
            />

            {t("paymentMethod")}{" "}
            (السودان)
          </label>

          {methodsLoading ? (
            <p className="text-sm text-gray-400 flex items-center gap-2 py-4">
              <Loader2
                className="animate-spin text-primary"
                size={18}
              />

              {t("loading")}
            </p>
          ) : methods.length === 0 ? (
            <p className="text-sm text-red-500">
              {lang === "ar"
                ? "لا توجد طرق دفع متاحة حالياً، يرجى التواصل مع المتجر"
                : "No payment methods are available right now, please contact the store"}
            </p>
          ) : (
            <div className="space-y-3">
              {methods.map((m) => (
                <label
                  key={m._id}
                  className={`flex items-center justify-between border rounded-2xl p-4 cursor-pointer transition-all ${
                    selectedMethodId ===
                    m._id
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={m._id}
                      checked={
                        selectedMethodId ===
                        m._id
                      }
                      onChange={() =>
                        setSelectedMethodId(
                          m._id
                        )
                      }
                      className="text-primary focus:ring-primary w-4 h-4"
                    />

                    <div>
                      <span className="font-semibold text-sm text-secondary block">
                        {
                          m.name[lang]
                        }
                      </span>

                      <span className="text-xs text-gray-500">
                        {m.type ===
                        "bank_transfer"
                          ? "تحويل عبر تطبيق بنكك (Bank of Khartoum)"
                          : m.type === "cod"
                          ? "الدفع نقداً أو تحويل عند الاستلام"
                          : "دفع فوري"}
                      </span>
                    </div>
                  </div>

                  {m.type ===
                    "bank_transfer" && (
                    <span className="text-[11px] bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full">
                      موصى به في السودان
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}

          {selectedMethod?.type !==
            "cod" &&
            selectedMethod?.instructions?.[
              lang
            ] && (
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-secondary">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-gray-500 uppercase tracking-wider">
                    بيانات التحويل:
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        selectedMethod
                          .instructions![
                          lang
                        ]
                      )
                    }
                    className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                  >
                    {copied ? (
                      <>
                        <Check
                          size={14}
                          className="text-green-600"
                        />

                        تم النسخ!
                      </>
                    ) : (
                      <>
                        <Copy size={14} />

                        نسخ التعليمات /
                        الحساب
                      </>
                    )}
                  </button>
                </div>

                <div className="whitespace-pre-line text-xs font-mono bg-white p-3 rounded-xl border border-gray-200 text-gray-700">
                  {
                    selectedMethod
                      .instructions[
                      lang
                    ]
                  }
                </div>

                <p className="text-[11px] text-gray-500 mt-2">
                  * يمكنك إرفاق صورة
                  إشعار التحويل ورقم
                  المعاملة مباشرة في
                  الصفحة التالية بعد
                  تأكيد الطلب.
                </p>
              </div>
            )}
        </div>

        {/* =====================================================
            الخطأ
            ===================================================== */}

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-4 rounded-2xl border border-red-100">
            {error}
          </div>
        )}

        {/* =====================================================
            تنفيذ الطلب
            ===================================================== */}

        <button
          type="submit"
          disabled={
            loading ||
            methods.length === 0 ||
            cartItems.length === 0
          }
          className="w-full bg-primary text-white py-4 rounded-full font-bold text-base shadow-xl shadow-primary/25 hover:bg-primary/95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2
                className="animate-spin"
                size={20}
              />

              جاري معالجة الطلب...
            </>
          ) : (
            t("placeOrder")
          )}
        </button>
      </form>
    </main>
  );
}