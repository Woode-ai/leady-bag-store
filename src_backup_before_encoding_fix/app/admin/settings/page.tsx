// src/app/admin/settings/page.tsx
// Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…ØªØ¬Ø± Ø§Ù„Ø¹Ø§Ù…Ø© - Ø­Ø§Ù„ÙŠØ§Ù‹ ØªØªØ­ÙƒÙ… Ø¨Ø²Ø± Ø§Ù„ÙˆØ§ØªØ³Ø§Ø¨ Ø§Ù„Ø¹Ø§Ø¦Ù… Ø§Ù„Ø°ÙŠ ÙŠØ¸Ù‡Ø± Ù„ÙƒÙ„ Ø²ÙˆØ§Ø± Ø§Ù„Ù…ÙˆÙ‚Ø¹

"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import ImageUploader from "@/components/ImageUploader";

export default function AdminSettingsPage() {
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappQrImage, setWhatsappQrImage] = useState("");
  const [pointsPerCurrencySpent, setPointsPerCurrencySpent] = useState(1);
  const [currencyValuePerPoint, setCurrencyValuePerPoint] = useState(10);
  const [minPointsToRedeem, setMinPointsToRedeem] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await apiClient("/settings");
      setWhatsappNumber(data.settings.whatsappNumber || "");
      setWhatsappQrImage(data.settings.whatsappQrImage || "");
      setPointsPerCurrencySpent(data.settings.pointsPerCurrencySpent || 1);
      setCurrencyValuePerPoint(data.settings.currencyValuePerPoint || 10);
      setMinPointsToRedeem(data.settings.minPointsToRedeem || 10);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await apiClient("/settings", {
        method: "PUT",
        body: JSON.stringify({
          whatsappNumber,
          whatsappQrImage,
          pointsPerCurrencySpent: Number(pointsPerCurrencySpent),
          currencyValuePerPoint: Number(currencyValuePerPoint),
          minPointsToRedeem: Number(minPointsToRedeem),
        }),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-gray-400">Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„...</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…ØªØ¬Ø± ÙˆÙ†Ù‚Ø§Ø· Ø§Ù„ÙˆÙ„Ø§Ø¡</h1>
      <p className="text-xs text-gray-500 mb-6">
        Ø¥Ø¯Ø§Ø±Ø© Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„ØªÙˆØ§ØµÙ„ ÙˆØ¨Ø±Ù†Ø§Ù…Ø¬ Ø§Ù„Ù…ÙƒØ§ÙØ¢Øª ÙˆÙ†Ù‚Ø§Ø· Ø§Ù„Ù‡Ø¯Ø§ÙŠØ§ Ù„Ø¹Ù…ÙŠÙ„Ø§Øª Leadybag
      </p>

      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm">
        {/* Ù‚Ø³Ù… Ø¨Ø±Ù†Ø§Ù…Ø¬ Ù†Ù‚Ø§Ø· Ø§Ù„ÙˆÙ„Ø§Ø¡ */}
        <div className="border-b border-gray-100 pb-6">
          <h2 className="text-base font-bold text-secondary mb-3">Ø¨Ø±Ù†Ø§Ù…Ø¬ Ù†Ù‚Ø§Ø· Ø§Ù„ÙˆÙ„Ø§Ø¡ ÙˆØ§Ù„Ù…ÙƒØ§ÙØ¢Øª (Loyalty Program)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Ù†Ù‚Ø§Ø· Ù„ÙƒÙ„ 100 SDG ØªÙ†ÙÙ‚Ù‡Ø§ Ø§Ù„Ø¹Ù…ÙŠÙ„
              </label>
              <input
                type="number"
                min={0}
                value={pointsPerCurrencySpent}
                onChange={(e) => setPointsPerCurrencySpent(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Ù‚ÙŠÙ…Ø© Ø§Ù„Ù†Ù‚Ø·Ø© Ø§Ù„ÙˆØ§Ø­Ø¯Ø© Ø¨Ø§Ù„Ø¬Ù†ÙŠÙ‡ (SDG)
              </label>
              <input
                type="number"
                min={1}
                value={currencyValuePerPoint}
                onChange={(e) => setCurrencyValuePerPoint(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ø¯Ù†Ù‰ Ù„Ø§Ø³ØªØ¨Ø¯Ø§Ù„ Ø§Ù„Ù†Ù‚Ø§Ø·
              </label>
              <input
                type="number"
                min={1}
                value={minPointsToRedeem}
                onChange={(e) => setMinPointsToRedeem(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Ù‚Ø³Ù… Ø§Ù„ÙˆØ§ØªØ³Ø§Ø¨ */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-secondary">Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø¯Ø¹Ù… Ø¹Ø¨Ø± ÙˆØ§ØªØ³Ø§Ø¨</h2>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Ø±Ù‚Ù… Ø§Ù„ÙˆØ§ØªØ³Ø§Ø¨ Ø§Ù„Ø±Ø³Ù…ÙŠ</label>
            <input
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="249912345678"
              dir="ltr"
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-start"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Ø¨ØµÙŠØºØ© Ø¯ÙˆÙ„ÙŠØ© Ø¨Ø¯ÙˆÙ† + Ø£Ùˆ Ù…Ø³Ø§ÙØ§Øª (Ù…Ø«Ø§Ù„: 249912345678).
            </p>
          </div>

          <ImageUploader
            currentUrl={whatsappQrImage}
            onUploaded={(url) => setWhatsappQrImage(url)}
            label="ØµÙˆØ±Ø© Ø±Ù…Ø² QR Ø§Ù„Ø®Ø§Øµ Ø¨ÙˆØ§ØªØ³Ø§Ø¨"
            folder="settings"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm font-semibold">ØªÙ… Ø­ÙØ¸ Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø¨Ù†Ø¬Ø§Ø­ âœ“</p>}

        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-white px-8 py-3 rounded-full text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/95 disabled:opacity-50 transition-all"
        >
          {saving ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø­ÙØ¸..." : "Ø­ÙØ¸ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª"}
        </button>
      </form>
    </div>
  );
}


