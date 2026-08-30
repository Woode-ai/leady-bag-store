// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { apiClient } from "@/lib/apiClient";

export default function LoginPage() {
  const { t, login } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Ø­Ø§Ù„Ø© Ø§Ø³ØªØ¹Ø§Ø¯Ø© ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<"send_code" | "reset_password">("send_code");
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotError, setForgotError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await apiClient("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, twoFactorCode: twoFactorCode || undefined }),
      });

      if (data.status === "needs_verification") {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }

      if (data.status === "2fa_required") {
        setNeedsTwoFactor(true);
        setLoading(false);
        return;
      }

      login(data.user);
      router.push("/");
    } catch (err: unknown) {
      setError((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    } finally {
      setLoading(false);
    }
  }

  // 1. Ø·Ù„Ø¨ Ø±Ù…Ø² Ø§Ø³ØªØ¹Ø§Ø¯Ø© ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±
  async function handleSendResetCode(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError("");
    setForgotMsg("");
    try {
      const data = await apiClient("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotMsg(data.message || "ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø±Ù…Ø² Ø§Ø³ØªØ¹Ø§Ø¯Ø© ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø¥Ù„Ù‰ Ø¨Ø±ÙŠØ¯Ùƒ");
      setForgotStep("reset_password");
    } catch (err: unknown) {
      setForgotError((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    } finally {
      setForgotLoading(false);
    }
  }

  // 2. ØªØ¹ÙŠÙŠÙ† ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError("");
    setForgotMsg("");
    try {
      const data = await apiClient("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email: forgotEmail,
          code: resetCode,
          newPassword,
        }),
      });
      alert(data.message || "ØªÙ… ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø¨Ù†Ø¬Ø§Ø­! ÙŠÙ…ÙƒÙ†Ùƒ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø§Ù„Ø¢Ù†.");
      setShowForgotModal(false);
      setForgotStep("send_code");
      setPassword("");
      setEmail(forgotEmail);
    } catch (err: unknown) {
      setForgotError((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-secondary mb-6 text-center">{t("login")}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">{t("email")}</label>
            <input
              type="email"
              required
              disabled={needsTwoFactor}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-100"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-secondary">{t("password")}</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setShowForgotModal(true);
                }}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Ù†Ø³ÙŠØª ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±ØŸ
              </button>
            </div>
            <input
              type="password"
              required
              disabled={needsTwoFactor}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-100"
            />
          </div>

          {needsTwoFactor && (
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                ÙƒÙˆØ¯ Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø© Ø§Ù„Ø«Ù†Ø§Ø¦ÙŠØ© (Ù…Ù† ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø©)
              </label>
              <input
                type="text"
                required
                autoFocus
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                placeholder="123456"
              />
            </div>
          )}

          {error && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-full font-semibold shadow-md shadow-primary/20 hover:bg-primary/95 disabled:opacity-50 transition-all"
          >
            {loading ? t("loading") : needsTwoFactor ? "ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø¯Ø®ÙˆÙ„" : t("login")}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6 pt-4 border-t border-gray-100">
          {t("dontHaveAccount")}{" "}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            {t("register")}
          </Link>
        </p>
      </div>

      {/* Ù…ÙˆØ¯Ø§Ù„ Ø§Ø³ØªØ¹Ø§Ø¯Ø© ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h2 className="text-xl font-bold text-secondary mb-1">Ø§Ø³ØªØ¹Ø§Ø¯Ø© ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±</h2>
            <p className="text-xs text-gray-500 mb-4">
              {forgotStep === "send_code"
                ? "Ø£Ø¯Ø®Ù„ÙŠ Ø¨Ø±ÙŠØ¯Ùƒ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ù„Ø¥Ø±Ø³Ø§Ù„ Ø±Ù…Ø² ØªØ­Ù‚Ù‚ Ø³Ø±ÙŠ Ù…Ù† 6 Ø£Ø±Ù‚Ø§Ù…"
                : "Ø£Ø¯Ø®Ù„ÙŠ Ø±Ù…Ø² Ø§Ù„ØªØ­Ù‚Ù‚ Ø§Ù„Ù…Ø³ØªÙ„Ù… ÙˆÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©"}
            </p>

            {forgotStep === "send_code" ? (
              <form onSubmit={handleSendResetCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {forgotError && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl">{forgotError}</div>}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/95 disabled:opacity-50"
                  >
                    {forgotLoading ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„..." : "Ø¥Ø±Ø³Ø§Ù„ Ø±Ù…Ø² Ø§Ù„ØªØ­Ù‚Ù‚"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200"
                  >
                    Ø¥Ù„ØºØ§Ø¡
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Ø±Ù…Ø² Ø§Ù„ØªØ­Ù‚Ù‚ (6 Ø£Ø±Ù‚Ø§Ù…)</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.trim())}
                    placeholder="123456"
                    className="w-full font-mono text-center tracking-[0.4em] text-lg font-bold border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {forgotError && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl">{forgotError}</div>}
                {forgotMsg && <div className="bg-green-50 text-green-700 text-xs p-3 rounded-xl">{forgotMsg}</div>}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/95 disabled:opacity-50"
                  >
                    {forgotLoading ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø­ÙØ¸..." : "Ø­ÙØ¸ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setForgotStep("send_code")}
                    className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200"
                  >
                    Ø±Ø¬ÙˆØ¹
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}


