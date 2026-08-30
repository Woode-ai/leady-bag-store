// src/app/account/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { apiClient } from "@/lib/apiClient";
import {
  Settings,
  MailWarning,
  Gift,
  Upload,
  RotateCcw,
  Clock,
  FileText,
} from "lucide-react";

const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  processing: "قيد التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  returned: "مسترجع",
};

const paymentStatusLabels: Record<
  string,
  { label: string; color: string }
> = {
  pending_verification: {
    label: "بانتظار مراجعة الإشعار",
    color: "bg-amber-100 text-amber-800",
  },
  verified: {
    label: "تم التحقق من الدفع ✓",
    color: "bg-green-100 text-green-800",
  },
  rejected: {
    label: "تم رفض الإشعار",
    color: "bg-red-100 text-red-800",
  },
  paid: {
    label: "مدفوع",
    color: "bg-green-100 text-green-800",
  },
  pending: {
    label: "قيد الدفع",
    color: "bg-gray-100 text-gray-700",
  },
  cod: {
    label: "دفع عند الاستلام",
    color: "bg-blue-100 text-blue-800",
  },
};

export default function AccountPage() {
  const { t, user } = useApp();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  // قيمة العملة لكل نقطة ولاء
  const [currencyValuePerPoint, setCurrencyValuePerPoint] =
    useState(10);

  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  // حالات مودال رفع الإيصال ومودال الاسترداد
  const [uploadOrderId, setUploadOrderId] = useState<string | null>(
    null
  );
  const [receiptImage, setReceiptImage] = useState("");
  const [transRef, setTransRef] = useState("");
  const [uploading, setUploading] = useState(false);

  const [refundOrderId, setRefundOrderId] = useState<string | null>(
    null
  );
  const [refundReason, setRefundReason] = useState("");
  const [requestingRefund, setRequestingRefund] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        const [ordersData, meData, settingsData] =
          await Promise.all([
            apiClient("/orders"),
            apiClient("/auth/me").catch(() => null),
            apiClient("/settings").catch(() => null),
          ]);

        setOrders(ordersData.orders || []);

        if (meData?.user) {
          setUserProfile(meData.user);
        }

        // جلب قيمة النقطة من إعدادات المتجر
        if (settingsData?.settings) {
          const value = Number(
            settingsData.settings.currencyValuePerPoint ?? 10
          );

          setCurrencyValuePerPoint(
            Number.isFinite(value) && value >= 0
              ? value
              : 10
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  async function handleResendVerification() {
    setResending(true);
    setResendMessage("");

    try {
      const data = await apiClient(
        "/auth/resend-verification",
        {
          method: "POST",
          body: JSON.stringify({
            email: user?.email,
          }),
        }
      );

      setResendMessage(data.message);
    } catch (err: unknown) {
      setResendMessage(
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setResending(false);
    }
  }

  // رفع إيصال بنكك
  async function handleUploadReceipt(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!uploadOrderId) return;

    setUploading(true);

    try {
      const data = await apiClient(
        `/orders/${uploadOrderId}/upload-receipt`,
        {
          method: "POST",
          body: JSON.stringify({
            receiptImage:
              receiptImage ||
              "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop",
            transactionReference: transRef,
          }),
        }
      );

      alert(
        data.message ||
          "تم رفع الإشعار بنجاح! سيقوم فريق العمل بمراجعته."
      );

      setUploadOrderId(null);
      setReceiptImage("");
      setTransRef("");

      // تحديث قائمة الطلبات
      const refreshed = await apiClient("/orders");
      setOrders(refreshed.orders || []);
    } catch (err: unknown) {
      alert(
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setUploading(false);
    }
  }

  // طلب استرجاع خلال 24 ساعة
  async function handleRequestRefund(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!refundOrderId) return;

    setRequestingRefund(true);

    try {
      const data = await apiClient(
        `/orders/${refundOrderId}/refund`,
        {
          method: "POST",
          body: JSON.stringify({
            reason: refundReason,
          }),
        }
      );

      alert(
        data.message ||
          "تم تقديم طلب الاسترجاع بنجاح!"
      );

      setRefundOrderId(null);
      setRefundReason("");

      const refreshed = await apiClient("/orders");
      setOrders(refreshed.orders || []);
    } catch (err: unknown) {
      alert(
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setRequestingRefund(false);
    }
  }

  function isWithin24Hours(createdAt: string) {
    const diffMs =
      Date.now() - new Date(createdAt).getTime();

    return diffMs <= 24 * 60 * 60 * 1000;
  }

  if (!user) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        <Link
          href="/login"
          className="bg-primary text-white px-8 py-3 rounded-full font-semibold shadow-lg shadow-primary/20"
        >
          {t("login")}
        </Link>
      </main>
    );
  }

  const loyaltyPoints = Number(
    userProfile?.loyaltyPoints || 0
  );

  const loyaltyValue = Math.floor(
    loyaltyPoints * currencyValuePerPoint
  );

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      {/* تنبيه تفعيل البريد الإلكتروني */}
      {user.emailVerified === false && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 mb-8 flex items-start gap-4 shadow-sm">
          <MailWarning
            className="text-amber-600 shrink-0 mt-0.5"
            size={24}
          />

          <div className="flex-1">
            <p className="text-sm text-amber-900 font-bold">
              لم تُفعِّلي بريدك الإلكتروني بعد
            </p>

            <p className="text-xs text-amber-700 mt-1">
              تحققي من بريدك ({user.email}) واكتبي رمز
              التحقق لتأمين حسابك بالكامل.
            </p>

            <div className="flex gap-4 mt-3">
              <Link
                href={`/verify-email?email=${encodeURIComponent(
                  user.email
                )}`}
                className="text-xs bg-amber-600 text-white px-4 py-1.5 rounded-full font-semibold"
              >
                إدخال رمز التحقق
              </Link>

              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="text-xs text-amber-800 font-medium underline disabled:opacity-50"
              >
                {resending
                  ? "جاري الإرسال..."
                  : "إعادة إرسال الرمز"}
              </button>
            </div>

            {resendMessage && (
              <p className="text-xs text-green-700 font-semibold mt-2">
                {resendMessage}
              </p>
            )}
          </div>
        </div>
      )}

      {/* رأس الحساب ورصيد النقاط */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-primary font-bold tracking-wider uppercase">
              حساب العميل
            </span>

            <h1 className="text-2xl font-bold text-secondary mt-1">
              {user.name}
            </h1>

            <p className="text-gray-400 text-sm mt-0.5">
              {user.email}
            </p>
          </div>

          {user.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-xs font-semibold bg-secondary text-white px-4 py-2.5 rounded-full hover:bg-secondary/90 transition-colors shadow-sm"
            >
              <Settings size={16} />
              لوحة التحكم
            </Link>
          )}
        </div>

        {/* كارت نقاط الولاء */}
        <div className="bg-gradient-to-br from-amber-500 via-rose-500 to-primary text-white rounded-3xl p-6 shadow-lg shadow-primary/20 relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-100">
              نقاط الولاء والمكافآت
            </span>

            <Gift
              size={22}
              className="text-amber-200"
            />
          </div>

          <div className="relative z-10 my-3">
            <div className="text-3xl font-black">
              {loyaltyPoints}
            </div>

            <p className="text-xs text-rose-100 mt-0.5">
              بقيمة خصماً تساوي{" "}
              {loyaltyValue} SDG
            </p>

            <p className="text-[10px] text-rose-100/80 mt-1">
              كل نقطة = {currencyValuePerPoint} SDG
            </p>
          </div>
        </div>
      </div>

      {/* قائمة الطلبات */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <h2 className="font-bold text-secondary text-xl mb-6 flex items-center gap-2">
          <FileText
            className="text-primary"
            size={20}
          />

          {t("myOrders")}
        </h2>

        {loading ? (
          <p className="text-gray-400 text-center py-10">
            {t("loading")}
          </p>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-gray-50/50 rounded-2xl">
            <p className="text-gray-400 mb-3">
              لا توجد طلبات سابقة لديك بعد
            </p>

            <Link
              href="/products"
              className="text-xs bg-primary text-white px-5 py-2 rounded-full font-semibold"
            >
              {t("shopNow")}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const eligibleForRefund =
                isWithin24Hours(order.createdAt) &&
                order.status !== "cancelled" &&
                order.returnStatus !== "approved";

              const pStatus =
                paymentStatusLabels[
                  order.paymentStatus
                ] || {
                  label: order.paymentStatus,
                  color:
                    "bg-gray-100 text-gray-700",
                };

              return (
                <div
                  key={order._id}
                  className="border border-gray-100 rounded-2xl p-5 hover:border-primary/20 transition-all bg-gray-50/30"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-secondary">
                        {order.trackingNumber}
                      </span>

                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${pStatus.color}`}
                      >
                        {pStatus.label}
                      </span>

                      <span className="text-[11px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        {statusLabels[
                          order.status
                        ] || order.status}
                      </span>
                    </div>

                    <span className="text-xs text-gray-400">
                      {new Date(
                        order.createdAt
                      ).toLocaleDateString("ar-SD", {
                        dateStyle: "medium",
                      })}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-primary font-black text-lg">
                        {order.total}{" "}
                        <span className="text-xs font-normal text-gray-500">
                          SDG
                        </span>
                      </p>

                      {order.loyaltyDiscount > 0 && (
                        <p className="text-[11px] text-amber-700">
                          وفرت {order.loyaltyDiscount} SDG
                          باستخدام نقاط المكافآت
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* زر رفع إشعار بنكك إذا كان مطلوباً */}
                      {order.paymentMethod?.type ===
                        "bank_transfer" &&
                        order.paymentStatus !==
                          "verified" && (
                          <button
                            onClick={() =>
                              setUploadOrderId(
                                order._id
                              )
                            }
                            className="flex items-center gap-1.5 text-xs bg-amber-500 text-white px-3.5 py-2 rounded-xl font-semibold hover:bg-amber-600 shadow-sm transition-colors"
                          >
                            <Upload size={14} />
                            رفع إشعار بنكك
                          </button>
                        )}

                      {/* زر استرداد خلال 24 ساعة */}
                      {eligibleForRefund &&
                        order.returnStatus ===
                          "none" && (
                          <button
                            onClick={() =>
                              setRefundOrderId(
                                order._id
                              )
                            }
                            className="flex items-center gap-1.5 text-xs bg-rose-50 text-rose-700 border border-rose-200 px-3.5 py-2 rounded-xl font-semibold hover:bg-rose-100 transition-colors"
                            title="متاح خلال 24 ساعة فقط من الشراء"
                          >
                            <RotateCcw size={14} />
                            طلب استرجاع (24 ساعة)
                          </button>
                        )}

                      {order.returnStatus ===
                        "requested" && (
                        <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1">
                          <Clock size={14} />
                          بانتظار مراجعة الإرجاع
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* نافذة مودال رفع إيصال بنكك */}
      {uploadOrderId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-secondary mb-1">
              رفع إشعار تحويل بنكك / فوري
            </h3>

            <p className="text-xs text-gray-500 mb-4">
              أدخلي رقم المعاملة البنكية أو رابط صورة
              الإشعار
            </p>

            <form
              onSubmit={handleUploadReceipt}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  رقم المعاملة / العملية
                </label>

                <input
                  type="text"
                  required
                  placeholder="مثال: 9876543210"
                  value={transRef}
                  onChange={(e) =>
                    setTransRef(e.target.value)
                  }
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  رابط صورة الإشعار (اختياري)
                </label>

                <input
                  type="url"
                  placeholder="https://..."
                  value={receiptImage}
                  onChange={(e) =>
                    setReceiptImage(e.target.value)
                  }
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/95 disabled:opacity-50"
                >
                  {uploading
                    ? "جاري الإرسال..."
                    : "تأكيد وإرسال الإشعار"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setUploadOrderId(null)
                  }
                  className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة مودال طلب استرجاع */}
      {refundOrderId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-secondary mb-1">
              طلب استرجاع المنتج
            </h3>

            <p className="text-xs text-gray-500 mb-4">
              وفقاً لسياسة Leadybag، متاح الاسترجاع
              خلال 24 ساعة فقط من وقت الطلب.
            </p>

            <form
              onSubmit={handleRequestRefund}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  سبب الاسترجاع
                </label>

                <textarea
                  required
                  rows={3}
                  placeholder="سبب الاسترجاع أو الاستبدال..."
                  value={refundReason}
                  onChange={(e) =>
                    setRefundReason(e.target.value)
                  }
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={requestingRefund}
                  className="flex-1 bg-rose-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-700 disabled:opacity-50"
                >
                  {requestingRefund
                    ? "جاري الإرسال..."
                    : "إرسال طلب الاسترجاع"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setRefundOrderId(null)
                  }
                  className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}