// src/app/account/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { apiClient } from "@/lib/apiClient";
import { Settings, MailWarning, Gift, Upload, RotateCcw, CheckCircle2, Clock, XCircle, FileText, ChevronRight } from "lucide-react";

const statusLabels: Record<string, string> = {
  pending: "Ù‚ÙŠØ¯ Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±",
  processing: "Ù‚ÙŠØ¯ Ø§Ù„ØªØ¬Ù‡ÙŠØ²",
  shipped: "ØªÙ… Ø§Ù„Ø´Ø­Ù†",
  delivered: "ØªÙ… Ø§Ù„ØªØ³Ù„ÙŠÙ…",
  cancelled: "Ù…Ù„ØºÙŠ",
  returned: "Ù…Ø³ØªØ±Ø¬Ø¹",
};

const paymentStatusLabels: Record<string, { label: string; color: string }> = {
  pending_verification: { label: "Ø¨Ø§Ù†ØªØ¸Ø§Ø± Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±", color: "bg-amber-100 text-amber-800" },
  verified: { label: "ØªÙ… Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ø¯ÙØ¹ âœ“", color: "bg-green-100 text-green-800" },
  rejected: { label: "ØªÙ… Ø±ÙØ¶ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±", color: "bg-red-100 text-red-800" },
  paid: { label: "Ù…Ø¯ÙÙˆØ¹", color: "bg-green-100 text-green-800" },
  pending: { label: "Ù‚ÙŠØ¯ Ø§Ù„Ø¯ÙØ¹", color: "bg-gray-100 text-gray-700" },
  cod: { label: "Ø¯ÙØ¹ Ø¹Ù†Ø¯ Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù…", color: "bg-blue-100 text-blue-800" },
};

export default function AccountPage() {
  const { t, lang, user, refreshUser } = useApp();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  // Ø­Ø§Ù„Ø§Øª Ù…ÙˆØ¯Ø§Ù„ Ø±ÙØ¹ Ø§Ù„Ø¥ÙŠØµØ§Ù„ ÙˆÙ…ÙˆØ¯Ø§Ù„ Ø§Ù„Ø§Ø³ØªØ±Ø¯Ø§Ø¯
  const [uploadOrderId, setUploadOrderId] = useState<string | null>(null);
  const [receiptImage, setReceiptImage] = useState("");
  const [transRef, setTransRef] = useState("");
  const [uploading, setUploading] = useState(false);

  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [requestingRefund, setRequestingRefund] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function loadData() {
      try {
        const [ordersData, meData] = await Promise.all([
          apiClient("/orders"),
          apiClient("/auth/me").catch(() => null),
        ]);
        setOrders(ordersData.orders || []);
        if (meData?.user) setUserProfile(meData.user);
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
      const data = await apiClient("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: user?.email }),
      });
      setResendMessage(data.message);
    } catch (err: unknown) {
      setResendMessage((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    } finally {
      setResending(false);
    }
  }

  // Ø±ÙØ¹ Ø¥ÙŠØµØ§Ù„ Ø¨Ù†ÙƒÙƒ
  async function handleUploadReceipt(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadOrderId) return;
    setUploading(true);
    try {
      const data = await apiClient(`/orders/${uploadOrderId}/upload-receipt`, {
        method: "POST",
        body: JSON.stringify({
          receiptImage: receiptImage || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop",
          transactionReference: transRef,
        }),
      });
      alert(data.message || "ØªÙ… Ø±ÙØ¹ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø± Ø¨Ù†Ø¬Ø§Ø­! Ø³ÙŠÙ‚ÙˆÙ… ÙØ±ÙŠÙ‚ Ø§Ù„Ø¹Ù…Ù„ Ø¨Ù…Ø±Ø§Ø¬Ø¹ØªÙ‡.");
      setUploadOrderId(null);
      setReceiptImage("");
      setTransRef("");
      // ØªØ­Ø¯ÙŠØ« Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø·Ù„Ø¨Ø§Øª
      const refreshed = await apiClient("/orders");
      setOrders(refreshed.orders || []);
    } catch (err: unknown) {
      alert((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    } finally {
      setUploading(false);
    }
  }

  // Ø·Ù„Ø¨ Ø§Ø³ØªØ±Ø¬Ø§Ø¹ Ø®Ù„Ø§Ù„ 24 Ø³Ø§Ø¹Ø©
  async function handleRequestRefund(e: React.FormEvent) {
    e.preventDefault();
    if (!refundOrderId) return;
    setRequestingRefund(true);
    try {
      const data = await apiClient(`/orders/${refundOrderId}/refund`, {
        method: "POST",
        body: JSON.stringify({ reason: refundReason }),
      });
      alert(data.message || "ØªÙ… ØªÙ‚Ø¯ÙŠÙ… Ø·Ù„Ø¨ Ø§Ù„Ø§Ø³ØªØ±Ø¬Ø§Ø¹ Ø¨Ù†Ø¬Ø§Ø­!");
      setRefundOrderId(null);
      setRefundReason("");
      const refreshed = await apiClient("/orders");
      setOrders(refreshed.orders || []);
    } catch (err: unknown) {
      alert((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    } finally {
      setRequestingRefund(false);
    }
  }

  function isWithin24Hours(createdAt: string) {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    return diffMs <= 24 * 60 * 60 * 1000;
  }

  if (!user) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        <Link href="/login" className="bg-primary text-white px-8 py-3 rounded-full font-semibold shadow-lg shadow-primary/20">
          {t("login")}
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      {/* ØªÙ†Ø¨ÙŠÙ‡ ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ */}
      {user.emailVerified === false && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 mb-8 flex items-start gap-4 shadow-sm">
          <MailWarning className="text-amber-600 shrink-0 mt-0.5" size={24} />
          <div className="flex-1">
            <p className="text-sm text-amber-900 font-bold">Ù„Ù… ØªÙÙØ¹ÙÙ‘Ù„ÙŠ Ø¨Ø±ÙŠØ¯Ùƒ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ø¨Ø¹Ø¯</p>
            <p className="text-xs text-amber-700 mt-1">
              ØªØ­Ù‚Ù‚ÙŠ Ù…Ù† Ø¨Ø±ÙŠØ¯Ùƒ ({user.email}) ÙˆØ§ÙƒØªØ¨ÙŠ Ø±Ù…Ø² Ø§Ù„ØªØ­Ù‚Ù‚ Ù„ØªØ£Ù…ÙŠÙ† Ø­Ø³Ø§Ø¨Ùƒ Ø¨Ø§Ù„ÙƒØ§Ù…Ù„.
            </p>
            <div className="flex gap-4 mt-3">
              <Link
                href={`/verify-email?email=${encodeURIComponent(user.email)}`}
                className="text-xs bg-amber-600 text-white px-4 py-1.5 rounded-full font-semibold"
              >
                Ø¥Ø¯Ø®Ø§Ù„ Ø±Ù…Ø² Ø§Ù„ØªØ­Ù‚Ù‚
              </Link>
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="text-xs text-amber-800 font-medium underline disabled:opacity-50"
              >
                {resending ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„..." : "Ø¥Ø¹Ø§Ø¯Ø© Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø±Ù…Ø²"}
              </button>
            </div>
            {resendMessage && <p className="text-xs text-green-700 font-semibold mt-2">{resendMessage}</p>}
          </div>
        </div>
      )}

      {/* Ø±Ø£Ø³ Ø§Ù„Ø­Ø³Ø§Ø¨ ÙˆØ±ØµÙŠØ¯ Ø§Ù„Ù†Ù‚Ø§Ø· */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-primary font-bold tracking-wider uppercase">Ø­Ø³Ø§Ø¨ Ø§Ù„Ø¹Ù…ÙŠÙ„</span>
            <h1 className="text-2xl font-bold text-secondary mt-1">{user.name}</h1>
            <p className="text-gray-400 text-sm mt-0.5">{user.email}</p>
          </div>
          {user.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-xs font-semibold bg-secondary text-white px-4 py-2.5 rounded-full hover:bg-secondary/90 transition-colors shadow-sm"
            >
              <Settings size={16} /> Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…
            </Link>
          )}
        </div>

        {/* ÙƒØ§Ø±Øª Ù†Ù‚Ø§Ø· Ø§Ù„ÙˆÙ„Ø§Ø¡ */}
        <div className="bg-gradient-to-br from-amber-500 via-rose-500 to-primary text-white rounded-3xl p-6 shadow-lg shadow-primary/20 relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-100">Ù†Ù‚Ø§Ø· Ø§Ù„ÙˆÙ„Ø§Ø¡ ÙˆØ§Ù„Ù…ÙƒØ§ÙØ¢Øª</span>
            <Gift size={22} className="text-amber-200" />
          </div>
          <div className="relative z-10 my-3">
            <div className="text-3xl font-black">{userProfile?.loyaltyPoints || 0}</div>
            <p className="text-xs text-rose-100 mt-0.5">
            <p className="text-xs text-rose-100 mt-0.5">
  Ø¨Ù‚ÙŠÙ…Ø© Ø®ØµÙ…Ø§Ù‹ ØªØ³Ø§ÙˆÙŠ {Math.floor((userProfile?.loyaltyPoints || 0) * 10)} SDG
</p>
            </p>
          </div>
          <p className="text-[11px] text-rose-200 relative z-10">ØªÙØ¶Ø§Ù ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ Ù…Ø¹ ÙƒÙ„ Ø¹Ù…Ù„ÙŠØ© Ø´Ø±Ø§Ø¡ Ø¬Ø¯ÙŠØ¯Ø© âœ¨</p>
        </div>
      </div>

      {/* Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø·Ù„Ø¨Ø§Øª */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <h2 className="font-bold text-secondary text-xl mb-6 flex items-center gap-2">
          <FileText className="text-primary" size={20} />
          {t("myOrders")}
        </h2>

        {loading ? (
          <p className="text-gray-400 text-center py-10">{t("loading")}</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-gray-50/50 rounded-2xl">
            <p className="text-gray-400 mb-3">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª Ø³Ø§Ø¨Ù‚Ø© Ù„Ø¯ÙŠÙƒ Ø¨Ø¹Ø¯</p>
            <Link href="/products" className="text-xs bg-primary text-white px-5 py-2 rounded-full font-semibold">
              {t("shopNow")}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const eligibleForRefund = isWithin24Hours(order.createdAt) && order.status !== "cancelled" && order.returnStatus !== "approved";
              const pStatus = paymentStatusLabels[order.paymentStatus] || { label: order.paymentStatus, color: "bg-gray-100 text-gray-700" };

              return (
                <div key={order._id} className="border border-gray-100 rounded-2xl p-5 hover:border-primary/20 transition-all bg-gray-50/30">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-secondary">{order.trackingNumber}</span>
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${pStatus.color}`}>
                        {pStatus.label}
                      </span>
                      <span className="text-[11px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("ar-SD", { dateStyle: "medium" })}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-primary font-black text-lg">
                        {order.total} <span className="text-xs font-normal text-gray-500">SDG</span>
                      </p>
                      {order.loyaltyDiscount > 0 && (
                        <p className="text-[11px] text-amber-700">ÙˆÙØ±Øª {order.loyaltyDiscount} SDG Ø¨Ø§Ø³ØªØ®Ø¯Ø§Ù… Ù†Ù‚Ø§Ø· Ø§Ù„Ù…ÙƒØ§ÙØ¢Øª</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Ø²Ø± Ø±ÙØ¹ Ø¥Ø´Ø¹Ø§Ø± Ø¨Ù†ÙƒÙƒ Ø¥Ø°Ø§ ÙƒØ§Ù† Ù…Ø·Ù„ÙˆØ¨Ø§Ù‹ */}
                      {order.paymentMethod?.type === "bank_transfer" && order.paymentStatus !== "verified" && (
                        <button
                          onClick={() => setUploadOrderId(order._id)}
                          className="flex items-center gap-1.5 text-xs bg-amber-500 text-white px-3.5 py-2 rounded-xl font-semibold hover:bg-amber-600 shadow-sm transition-colors"
                        >
                          <Upload size={14} /> Ø±ÙØ¹ Ø¥Ø´Ø¹Ø§Ø± Ø¨Ù†ÙƒÙƒ
                        </button>
                      )}

                      {/* Ø²Ø± Ø§Ø³ØªØ±Ø¯Ø§Ø¯ Ø®Ù„Ø§Ù„ 24 Ø³Ø§Ø¹Ø© */}
                      {eligibleForRefund && order.returnStatus === "none" && (
                        <button
                          onClick={() => setRefundOrderId(order._id)}
                          className="flex items-center gap-1.5 text-xs bg-rose-50 text-rose-700 border border-rose-200 px-3.5 py-2 rounded-xl font-semibold hover:bg-rose-100 transition-colors"
                          title="Ù…ØªØ§Ø­ Ø®Ù„Ø§Ù„ 24 Ø³Ø§Ø¹Ø© ÙÙ‚Ø· Ù…Ù† Ø§Ù„Ø´Ø±Ø§Ø¡"
                        >
                          <RotateCcw size={14} /> Ø·Ù„Ø¨ Ø§Ø³ØªØ±Ø¬Ø§Ø¹ (24 Ø³Ø§Ø¹Ø©)
                        </button>
                      )}

                      {order.returnStatus === "requested" && (
                        <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1">
                          <Clock size={14} /> Ø¨Ø§Ù†ØªØ¸Ø§Ø± Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø¥Ø±Ø¬Ø§Ø¹
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

      {/* Ù†Ø§ÙØ°Ø© Ù…ÙˆØ¯Ø§Ù„ Ø±ÙØ¹ Ø¥ÙŠØµØ§Ù„ Ø¨Ù†ÙƒÙƒ */}
      {uploadOrderId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-secondary mb-1">Ø±ÙØ¹ Ø¥Ø´Ø¹Ø§Ø± ØªØ­ÙˆÙŠÙ„ Ø¨Ù†ÙƒÙƒ / ÙÙˆØ±ÙŠ</h3>
            <p className="text-xs text-gray-500 mb-4">Ø£Ø¯Ø®Ù„ÙŠ Ø±Ù‚Ù… Ø§Ù„Ù…Ø¹Ø§Ù…Ù„Ø© Ø§Ù„Ø¨Ù†ÙƒÙŠØ© Ø£Ùˆ Ø±Ø§Ø¨Ø· ØµÙˆØ±Ø© Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±</p>

            <form onSubmit={handleUploadReceipt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ø±Ù‚Ù… Ø§Ù„Ù…Ø¹Ø§Ù…Ù„Ø© / Ø§Ù„Ø¹Ù…Ù„ÙŠØ©</label>
                <input
                  type="text"
                  required
                  placeholder="Ù…Ø«Ø§Ù„: 9876543210"
                  value={transRef}
                  onChange={(e) => setTransRef(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ø±Ø§Ø¨Ø· ØµÙˆØ±Ø© Ø§Ù„Ø¥Ø´Ø¹Ø§Ø± (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={receiptImage}
                  onChange={(e) => setReceiptImage(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/95 disabled:opacity-50"
                >
                  {uploading ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„..." : "ØªØ£ÙƒÙŠØ¯ ÙˆØ¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±"}
                </button>
                <button
                  type="button"
                  onClick={() => setUploadOrderId(null)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200"
                >
                  Ø¥Ù„ØºØ§Ø¡
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ù†Ø§ÙØ°Ø© Ù…ÙˆØ¯Ø§Ù„ Ø·Ù„Ø¨ Ø§Ø³ØªØ±Ø¬Ø§Ø¹ */}
      {refundOrderId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-secondary mb-1">Ø·Ù„Ø¨ Ø§Ø³ØªØ±Ø¬Ø§Ø¹ Ø§Ù„Ù…Ù†ØªØ¬</h3>
            <p className="text-xs text-gray-500 mb-4">ÙˆÙÙ‚Ø§Ù‹ Ù„Ø³ÙŠØ§Ø³Ø© LeadybagØŒ Ù…ØªØ§Ø­ Ø§Ù„Ø§Ø³ØªØ±Ø¬Ø§Ø¹ Ø®Ù„Ø§Ù„ 24 Ø³Ø§Ø¹Ø© ÙÙ‚Ø· Ù…Ù† ÙˆÙ‚Øª Ø§Ù„Ø·Ù„Ø¨.</p>

            <form onSubmit={handleRequestRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ø³Ø¨Ø¨ Ø§Ù„Ø§Ø³ØªØ±Ø¬Ø§Ø¹</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ø³Ø¨Ø¨ Ø§Ù„Ø§Ø³ØªØ±Ø¬Ø§Ø¹ Ø£Ùˆ Ø§Ù„Ø§Ø³ØªØ¨Ø¯Ø§Ù„..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={requestingRefund}
                  className="flex-1 bg-rose-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-700 disabled:opacity-50"
                >
                  {requestingRefund ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„..." : "Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ Ø§Ù„Ø§Ø³ØªØ±Ø¬Ø§Ø¹"}
                </button>
                <button
                  type="button"
                  onClick={() => setRefundOrderId(null)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200"
                >
                  Ø¥Ù„ØºØ§Ø¡
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}


