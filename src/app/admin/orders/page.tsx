// src/app/admin/orders/page.tsx
"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { Check, X, Eye, ExternalLink, RotateCcw, AlertTriangle } from "lucide-react";

const statusOptions = [
  { value: "pending", label: "قيد الانتظار", color: "bg-gray-100 text-gray-600" },
  { value: "processing", label: "قيد التجهيز", color: "bg-blue-100 text-blue-600" },
  { value: "shipped", label: "تم الشحن", color: "bg-purple-100 text-purple-600" },
  { value: "delivered", label: "تم التسليم", color: "bg-green-100 text-green-600" },
  { value: "cancelled", label: "ملغي", color: "bg-red-100 text-red-600" },
  { value: "returned", label: "مسترجع", color: "bg-orange-100 text-orange-600" },
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

  // التحقق من إيصال بنكك (اعتماد أو رفض)
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

  // الموافقة على طلب استرجاع
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
      <h1 className="text-2xl font-bold text-secondary mb-6">إدارة الطلبات والمدفوعات</h1>

      {loading ? (
        <p className="text-gray-400">جاري التحميل...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-400">لا توجد طلبات بعد</p>
      ) : (
        <div className="border border-gray-200 rounded-2xl overflow-hidden overflow-x-auto shadow-sm bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
              <tr>
                <th className="p-3.5 text-start">رقم التتبع</th>
                <th className="p-3.5 text-start">العميل / العنوان</th>
                <th className="p-3.5 text-start">الإجمالي</th>
                <th className="p-3.5 text-start">طريقة الدفع والإشعار</th>
                <th className="p-3.5 text-start">حالة الدفع</th>
                <th className="p-3.5 text-start">الاسترجاع</th>
                <th className="p-3.5 text-start">حالة الطلب</th>
                <th className="p-3.5 text-start">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-3.5 font-mono text-xs font-bold text-secondary">{order.trackingNumber}</td>
                  <td className="p-3.5 text-xs">
                    <p className="font-semibold text-secondary">{order.userId?.name || "عميل"}</p>
                    <p className="text-gray-400 truncate max-w-[140px]">{order.shippingAddress}</p>
                  </td>
                  <td className="p-3.5 font-black text-primary">{order.total} SDG</td>
                  <td className="p-3.5 text-xs">
                    <p className="font-semibold">{order.paymentMethod?.name?.ar || "—"}</p>
                    {order.transactionReference && (
                      <p className="text-[11px] text-gray-500 font-mono">رقم: {order.transactionReference}</p>
                    )}
                    {order.receiptImage && (
                      <button
                        onClick={() => setPreviewReceipt(order.receiptImage)}
                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-1 font-semibold"
                      >
                        <Eye size={12} /> معاينة الإشعار
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
                          ? "معتمد بنكك ✓"
                          : order.paymentStatus === "paid"
                          ? "مدفوع"
                          : order.paymentStatus === "rejected"
                          ? "مرفوض"
                          : "بانتظار التحقق"}
                      </span>

                      {/* أزرار اعتماد أو رفض إشعار بنكك */}
                      {order.paymentStatus !== "verified" && order.paymentStatus !== "paid" && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            onClick={() => verifyPayment(order._id, "verified")}
                            disabled={updatingId === order._id}
                            className="bg-green-600 text-white p-1 rounded-lg hover:bg-green-700 disabled:opacity-50"
                            title="اعتماد الإشعار وتأكيد الدفع"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => verifyPayment(order._id, "rejected")}
                            disabled={updatingId === order._id}
                            className="bg-red-500 text-white p-1 rounded-lg hover:bg-red-600 disabled:opacity-50"
                            title="رفض الإشعار"
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
                          <RotateCcw size={12} /> مطلوب استرجاع
                        </p>
                        <p className="text-[11px] text-purple-700 mb-2 truncate max-w-[120px]">
                          السبب: {order.returnReason}
                        </p>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleRefundDecision(order._id, "approve")}
                            className="bg-green-600 text-white px-2 py-0.5 rounded text-[10px] font-bold"
                          >
                            قبول
                          </button>
                          <button
                            onClick={() => handleRefundDecision(order._id, "reject")}
                            className="bg-gray-400 text-white px-2 py-0.5 rounded text-[10px] font-bold"
                          >
                            رفض
                          </button>
                        </div>
                      </div>
                    ) : order.returnStatus === "approved" ? (
                      <span className="text-[11px] bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded-full">
                        تمت الموافقة
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
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

      {/* نافذة معاينة صورة الإشعار */}
      {previewReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-secondary text-base">إشعار التحويل البنكي (بنكك)</h3>
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
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


