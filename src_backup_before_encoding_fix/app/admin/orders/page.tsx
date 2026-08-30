// src/app/admin/orders/page.tsx
"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { Check, X, Eye, ExternalLink, RotateCcw, AlertTriangle } from "lucide-react";

const statusOptions = [
  { value: "pending", label: "Ù‚ÙŠØ¯ Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±", color: "bg-gray-100 text-gray-600" },
  { value: "processing", label: "Ù‚ÙŠØ¯ Ø§Ù„ØªØ¬Ù‡ÙŠØ²", color: "bg-blue-100 text-blue-600" },
  { value: "shipped", label: "ØªÙ… Ø§Ù„Ø´Ø­Ù†", color: "bg-purple-100 text-purple-600" },
  { value: "delivered", label: "ØªÙ… Ø§Ù„ØªØ³Ù„ÙŠÙ…", color: "bg-green-100 text-green-600" },
  { value: "cancelled", label: "Ù…Ù„ØºÙŠ", color: "bg-red-100 text-red-600" },
  { value: "returned", label: "Ù…Ø³ØªØ±Ø¬Ø¹", color: "bg-orange-100 text-orange-600" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const data = await apiClient("/orders");
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId: string, status: string) {
    setUpdatingId(orderId);
    try {
      await apiClient(`/orders/${orderId}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      await loadOrders();
    } catch (err: unknown) {
      alert((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    } finally {
      setUpdatingId(null);
    }
  }

  // Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø¥ÙŠØµØ§Ù„ Ø¨Ù†ÙƒÙƒ (Ø§Ø¹ØªÙ…Ø§Ø¯ Ø£Ùˆ Ø±ÙØ¶)
  async function verifyPayment(orderId: string, status: "verified" | "rejected") {
    setUpdatingId(orderId);
    try {
      await apiClient(`/admin/orders/${orderId}/verify-payment`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadOrders();
    } catch (err: unknown) {
      alert((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    } finally {
      setUpdatingId(null);
    }
  }

  // Ø§Ù„Ù…ÙˆØ§ÙÙ‚Ø© Ø¹Ù„Ù‰ Ø·Ù„Ø¨ Ø§Ø³ØªØ±Ø¬Ø§Ø¹
  async function handleRefundDecision(orderId: string, action: "approve" | "reject") {
    setUpdatingId(orderId);
    try {
      await apiClient(`/admin/orders/${orderId}/refund`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      await loadOrders();
    } catch (err: unknown) {
      alert((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    } finally {
      setUpdatingId(null);
    }
  }

  function statusStyle(status: string) {
    return statusOptions.find((s) => s.value === status)?.color || "bg-gray-100 text-gray-600";
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary mb-6">Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø·Ù„Ø¨Ø§Øª ÙˆØ§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª</h1>

      {loading ? (
        <p className="text-gray-400">Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-400">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª Ø¨Ø¹Ø¯</p>
      ) : (
        <div className="border border-gray-200 rounded-2xl overflow-hidden overflow-x-auto shadow-sm bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
              <tr>
                <th className="p-3.5 text-start">Ø±Ù‚Ù… Ø§Ù„ØªØªØ¨Ø¹</th>
                <th className="p-3.5 text-start">Ø§Ù„Ø¹Ù…ÙŠÙ„ / Ø§Ù„Ø¹Ù†ÙˆØ§Ù†</th>
                <th className="p-3.5 text-start">Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ</th>
                <th className="p-3.5 text-start">Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø¯ÙØ¹ ÙˆØ§Ù„Ø¥Ø´Ø¹Ø§Ø±</th>
                <th className="p-3.5 text-start">Ø­Ø§Ù„Ø© Ø§Ù„Ø¯ÙØ¹</th>
                <th className="p-3.5 text-start">Ø§Ù„Ø§Ø³ØªØ±Ø¬Ø§Ø¹</th>
                <th className="p-3.5 text-start">Ø­Ø§Ù„Ø© Ø§Ù„Ø·Ù„Ø¨</th>
                <th className="p-3.5 text-start">Ø§Ù„ØªØ§Ø±ÙŠØ®</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-3.5 font-mono text-xs font-bold text-secondary">{order.trackingNumber}</td>
                  <td className="p-3.5 text-xs">
                    <p className="font-semibold text-secondary">{order.userId?.name || "Ø¹Ù…ÙŠÙ„"}</p>
                    <p className="text-gray-400 truncate max-w-[140px]">{order.shippingAddress}</p>
                  </td>
                  <td className="p-3.5 font-black text-primary">{order.total} SDG</td>
                  <td className="p-3.5 text-xs">
                    <p className="font-semibold">{order.paymentMethod?.name?.ar || "â€”"}</p>
                    {order.transactionReference && (
                      <p className="text-[11px] text-gray-500 font-mono">Ø±Ù‚Ù…: {order.transactionReference}</p>
                    )}
                    {order.receiptImage && (
                      <button
                        onClick={() => setPreviewReceipt(order.receiptImage)}
                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-1 font-semibold"
                      >
                        <Eye size={12} /> Ù…Ø¹Ø§ÙŠÙ†Ø© Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±
                      </button>
                    )}
                  </td>
                  <td className="p-3.5">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold w-fit ${
                          order.paymentStatus === "verified" || order.paymentStatus === "paid"
                            ? "bg-green-100 text-green-700"
                            : order.paymentStatus === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {order.paymentStatus === "verified"
                          ? "Ù…Ø¹ØªÙ…Ø¯ Ø¨Ù†ÙƒÙƒ âœ“"
                          : order.paymentStatus === "paid"
                          ? "Ù…Ø¯ÙÙˆØ¹"
                          : order.paymentStatus === "rejected"
                          ? "Ù…Ø±ÙÙˆØ¶"
                          : "Ø¨Ø§Ù†ØªØ¸Ø§Ø± Ø§Ù„ØªØ­Ù‚Ù‚"}
                      </span>

                      {/* Ø£Ø²Ø±Ø§Ø± Ø§Ø¹ØªÙ…Ø§Ø¯ Ø£Ùˆ Ø±ÙØ¶ Ø¥Ø´Ø¹Ø§Ø± Ø¨Ù†ÙƒÙƒ */}
                      {order.paymentStatus !== "verified" && order.paymentStatus !== "paid" && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            onClick={() => verifyPayment(order._id, "verified")}
                            disabled={updatingId === order._id}
                            className="bg-green-600 text-white p-1 rounded-lg hover:bg-green-700 disabled:opacity-50"
                            title="Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø± ÙˆØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø¯ÙØ¹"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => verifyPayment(order._id, "rejected")}
                            disabled={updatingId === order._id}
                            className="bg-red-500 text-white p-1 rounded-lg hover:bg-red-600 disabled:opacity-50"
                            title="Ø±ÙØ¶ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5 text-xs">
                    {order.returnStatus === "requested" ? (
                      <div className="bg-purple-50 p-2 rounded-xl border border-purple-200">
                        <p className="font-bold text-purple-900 mb-1 flex items-center gap-1">
                          <RotateCcw size={12} /> Ù…Ø·Ù„ÙˆØ¨ Ø§Ø³ØªØ±Ø¬Ø§Ø¹
                        </p>
                        <p className="text-[11px] text-purple-700 mb-2 truncate max-w-[120px]">
                          Ø§Ù„Ø³Ø¨Ø¨: {order.returnReason}
                        </p>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleRefundDecision(order._id, "approve")}
                            className="bg-green-600 text-white px-2 py-0.5 rounded text-[10px] font-bold"
                          >
                            Ù‚Ø¨ÙˆÙ„
                          </button>
                          <button
                            onClick={() => handleRefundDecision(order._id, "reject")}
                            className="bg-gray-400 text-white px-2 py-0.5 rounded text-[10px] font-bold"
                          >
                            Ø±ÙØ¶
                          </button>
                        </div>
                      </div>
                    ) : order.returnStatus === "approved" ? (
                      <span className="text-[11px] bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded-full">
                        ØªÙ…Øª Ø§Ù„Ù…ÙˆØ§ÙÙ‚Ø©
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">â€”</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <select
                      value={order.status}
                      disabled={updatingId === order._id}
                      onChange={(e) => updateStatus(order._id, e.target.value)}
                      className={`text-xs rounded-full px-3 py-1 font-semibold border-0 cursor-pointer ${statusStyle(
                        order.status
                      )}`}
                    >
                      {statusOptions.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3.5 text-gray-400 text-xs">
                    {new Date(order.createdAt).toLocaleDateString("ar-SD")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ù†Ø§ÙØ°Ø© Ù…Ø¹Ø§ÙŠÙ†Ø© ØµÙˆØ±Ø© Ø§Ù„Ø¥Ø´Ø¹Ø§Ø± */}
      {previewReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-secondary text-base">Ø¥Ø´Ø¹Ø§Ø± Ø§Ù„ØªØ­ÙˆÙŠÙ„ Ø§Ù„Ø¨Ù†ÙƒÙŠ (Ø¨Ù†ÙƒÙƒ)</h3>
              <button onClick={() => setPreviewReceipt(null)} className="text-gray-400 hover:text-secondary">
                <X size={20} />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center p-2">
              <img src={previewReceipt} alt="Payment Receipt" className="max-w-full max-h-80 object-contain rounded-xl" />
            </div>
            <button
              onClick={() => setPreviewReceipt(null)}
              className="w-full mt-4 bg-secondary text-white py-2.5 rounded-xl font-semibold text-sm"
            >
              Ø¥ØºÙ„Ø§Ù‚
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


