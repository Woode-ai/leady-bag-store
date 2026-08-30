// src/app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { AlertTriangle } from "lucide-react";

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient("/analytics");
        setAnalytics(data.analytics);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p className="text-gray-400">Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„...</p>;
  if (!analytics) return <p className="text-gray-400">ØªØ¹Ø°Ù‘Ø± ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª</p>;

  const maxSale = Math.max(...analytics.last7Days.map((d: any) => d.sales), 1);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-secondary">Ù„ÙˆØ­Ø© Ø§Ù„Ù‚ÙŠØ§Ø¯Ø©</h1>

      {/* Ø¨Ø·Ø§Ù‚Ø§Øª Ø§Ù„Ù…Ù„Ø®Øµ */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="border border-gray-200 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø¥ÙŠØ±Ø§Ø¯Ø§Øª</p>
          <p className="text-2xl font-bold text-primary">{analytics.totalRevenue}</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Ø¹Ø¯Ø¯ Ø§Ù„Ø·Ù„Ø¨Ø§Øª</p>
          <p className="text-2xl font-bold text-secondary">{analytics.totalOrders}</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Ø¹Ø¯Ø¯ Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª</p>
          <p className="text-2xl font-bold text-secondary">{analytics.totalProducts}</p>
        </div>
      </div>

      {/* Ø±Ø³Ù… Ø¨ÙŠØ§Ù†ÙŠ Ø¨Ø³ÙŠØ· Ù„Ù„Ù…Ø¨ÙŠØ¹Ø§Øª Ø¢Ø®Ø± 7 Ø£ÙŠØ§Ù… */}
      <div className="border border-gray-200 rounded-xl p-4">
        <h2 className="font-medium text-secondary mb-4">Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª Ø¢Ø®Ø± 7 Ø£ÙŠØ§Ù…</h2>
        <div className="flex items-end gap-2 h-40">
          {analytics.last7Days.map((day: any) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-primary rounded-t-md"
                style={{ height: `${Math.max((day.sales / maxSale) * 100, 4)}%` }}
                title={`${day.sales}`}
              />
              <span className="text-[10px] text-gray-400">{day.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ø£ÙƒØ«Ø± Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ù…Ø¨ÙŠØ¹Ø§Ù‹ */}
        <div className="border border-gray-200 rounded-xl p-4">
          <h2 className="font-medium text-secondary mb-3">Ø£ÙƒØ«Ø± Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ù…Ø¨ÙŠØ¹Ø§Ù‹</h2>
          {analytics.topProducts.length === 0 ? (
            <p className="text-gray-400 text-sm">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ø¨ÙŠØ¹Ø§Øª Ø¨Ø¹Ø¯</p>
          ) : (
            <ul className="space-y-2">
              {analytics.topProducts.map((p: any, i: number) => (
                <li key={i} className="flex justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="text-primary font-medium">{p.count} Ù‚Ø·Ø¹Ø©</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ù†ÙØ§Ø¯ Ø§Ù„Ù…Ø®Ø²ÙˆÙ† */}
        <div className="border border-gray-200 rounded-xl p-4">
          <h2 className="font-medium text-secondary mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-yellow-500" />
            ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø§Ù„Ù…Ø®Ø²ÙˆÙ† Ø§Ù„Ù…Ù†Ø®ÙØ¶
          </h2>
          {analytics.lowStockProducts.length === 0 ? (
            <p className="text-gray-400 text-sm">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù†ØªØ¬Ø§Øª Ø¹Ù„Ù‰ ÙˆØ´Ùƒ Ø§Ù„Ù†ÙØ§Ø¯</p>
          ) : (
            <ul className="space-y-2">
              {analytics.lowStockProducts.map((p: any) => (
                <li key={p._id} className="flex justify-between text-sm">
                  <span>{p.name?.ar}</span>
                  <span className="text-red-500 font-medium">Ù…ØªØ¨Ù‚ÙŠ {p.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}


