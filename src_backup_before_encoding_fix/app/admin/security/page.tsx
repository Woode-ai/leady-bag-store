// src/app/admin/security/page.tsx
"use client";

import { useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { ShieldCheck, ShieldOff } from "lucide-react";

export default function AdminSecurityPage() {
  const [step, setStep] = useState<"idle" | "setup" | "done">("idle");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function startSetup() {
    setLoading(true);
    setError("");
    try {
      const data = await apiClient("/auth/2fa/setup", { method: "POST" });
      setQrCode(data.qrCodeDataUrl);
      setSecret(data.secret);
      setStep("setup");
    } catch (err: unknown) {
      setError((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    } finally {
      setLoading(false);
    }
  }

  async function confirmSetup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiClient("/auth/2fa/verify", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      setMessage("ØªÙ… ØªÙØ¹ÙŠÙ„ Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø© Ø§Ù„Ø«Ù†Ø§Ø¦ÙŠØ© Ø¨Ù†Ø¬Ø§Ø­! Ø³ÙŠÙØ·Ù„Ø¨ Ù…Ù†Ùƒ Ø§Ù„ÙƒÙˆØ¯ ÙÙŠ ÙƒÙ„ ØªØ³Ø¬ÙŠÙ„ Ø¯Ø®ÙˆÙ„ Ù‚Ø§Ø¯Ù…");
      setStep("done");
    } catch (err: unknown) {
      setError((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    } finally {
      setLoading(false);
    }
  }

  async function disable2FA(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiClient("/auth/2fa/disable", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setMessage("ØªÙ… ØªØ¹Ø·ÙŠÙ„ Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø© Ø§Ù„Ø«Ù†Ø§Ø¦ÙŠØ©");
      setStep("idle");
      setPassword("");
    } catch (err: unknown) {
      setError((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-secondary mb-6">Ø§Ù„Ø£Ù…Ø§Ù†</h1>

      <div className="border border-gray-200 rounded-xl p-5">
        <h2 className="font-medium text-secondary mb-3 flex items-center gap-2">
          <ShieldCheck size={18} className="text-green-600" />
          Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø© Ø§Ù„Ø«Ù†Ø§Ø¦ÙŠØ© (2FA)
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Ø·Ø¨Ù‚Ø© Ø­Ù…Ø§ÙŠØ© Ø¥Ø¶Ø§ÙÙŠØ©: Ø¨Ø¹Ø¯ ØªÙØ¹ÙŠÙ„Ù‡Ø§ØŒ Ø³ØªØ­ØªØ§Ø¬ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± + ÙƒÙˆØ¯ Ù…ØªØºÙŠÙ‘Ø± Ù…Ù† ØªØ·Ø¨ÙŠÙ‚ Ù…ØµØ§Ø¯Ù‚Ø©
          (Ù…Ø«Ù„ Google Authenticator) ÙÙŠ ÙƒÙ„ ØªØ³Ø¬ÙŠÙ„ Ø¯Ø®ÙˆÙ„.
        </p>

        {message && <p className="text-green-600 text-sm mb-3">{message}</p>}
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        {step === "idle" && (
          <button
            onClick={startSetup}
            disabled={loading}
            className="bg-primary text-white px-5 py-2 rounded-full text-sm disabled:opacity-50"
          >
            {loading ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ø¶ÙŠØ±..." : "ØªÙØ¹ÙŠÙ„ Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø© Ø§Ù„Ø«Ù†Ø§Ø¦ÙŠØ©"}
          </button>
        )}

        {step === "setup" && (
          <div>
            <p className="text-sm text-secondary mb-3">
              1. Ø­Ù…Ù‘Ù„ ØªØ·Ø¨ÙŠÙ‚ <strong>Google Authenticator</strong> Ø£Ùˆ Ø£ÙŠ ØªØ·Ø¨ÙŠÙ‚ Ù…ØµØ§Ø¯Ù‚Ø© Ù…Ø´Ø§Ø¨Ù‡ Ø¹Ù„Ù‰ Ù‡Ø§ØªÙÙƒ
              <br />
              2. Ø§Ù…Ø³Ø­ Ø±Ù…Ø² QR Ø§Ù„ØªØ§Ù„ÙŠ:
            </p>
            {qrCode && (
              <img src={qrCode} alt="QR Code" className="w-48 h-48 mx-auto border border-gray-200 rounded-lg mb-3" />
            )}
            <p className="text-xs text-gray-400 mb-3 text-center">
              Ø£Ùˆ Ø£Ø¯Ø®Ù„ Ù‡Ø°Ø§ Ø§Ù„ÙƒÙˆØ¯ ÙŠØ¯ÙˆÙŠØ§Ù‹: <span className="font-mono">{secret}</span>
            </p>
            <form onSubmit={confirmSetup} className="flex gap-2">
              <input
                type="text"
                placeholder="Ø£Ø¯Ø®Ù„ Ø§Ù„ÙƒÙˆØ¯ Ø§Ù„Ù…ÙƒÙˆÙ‘Ù† Ù…Ù† 6 Ø£Ø±Ù‚Ø§Ù…"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                maxLength={6}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                ØªØ£ÙƒÙŠØ¯
              </button>
            </form>
          </div>
        )}

        {step === "done" && (
          <form onSubmit={disable2FA} className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-sm text-secondary mb-2 flex items-center gap-1">
              <ShieldOff size={14} /> Ù„ØªØ¹Ø·ÙŠÙ„ Ø§Ù„Ø­Ù…Ø§ÙŠØ©ØŒ Ø£Ø¯Ø®Ù„ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±:
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                ØªØ¹Ø·ÙŠÙ„
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}


