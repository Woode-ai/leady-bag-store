// src/app/verify-email/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, MailCheck, Loader2, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { apiClient } from "@/lib/apiClient";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email") || "";
  const { login } = useApp();
  const router = useRouter();

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(token ? "loading" : "idle");
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  // Ø¥Ø°Ø§ ÙˆØµÙ„ Ø¹Ø¨Ø± Ø±Ø§Ø¨Ø· token Ù…Ø¨Ø§Ø´Ø±
  useEffect(() => {
    if (!token) return;
    async function verifyWithToken() {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setStatus("success");
        setMessage(data.message);
      } catch (err: unknown) {
        setStatus("error");
        setMessage((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
      }
    }
    verifyWithToken();
  }, [token]);

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setMessage("ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø±Ù…Ø² Ø§Ù„ØªØ­Ù‚Ù‚ Ø§Ù„Ù…ÙƒÙˆÙ† Ù…Ù† 6 Ø£Ø±Ù‚Ø§Ù…");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const data = await apiClient("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });

      setStatus("success");
      setMessage(data.message);
      if (data.user) {
        login(data.user);
      }
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err: unknown) {
      setStatus("error");
      setMessage((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    }
  }

  async function handleResend() {
    if (!email) {
      setMessage("ÙŠØ±Ø¬Ù‰ ÙƒØªØ§Ø¨Ø© Ø¨Ø±ÙŠØ¯Ùƒ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ");
      return;
    }
    setResending(true);
    setResendMsg("");
    try {
      const data = await apiClient("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setResendMsg(data.message);
    } catch (err: unknown) {
      setResendMsg((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
        {status === "success" ? (
          <div className="text-center py-6">
            <CheckCircle className="mx-auto text-green-500 mb-4 animate-bounce" size={60} />
            <h1 className="text-2xl font-bold text-secondary mb-2">ØªÙ… ØªÙØ¹ÙŠÙ„ Ø­Ø³Ø§Ø¨Ùƒ Ø¨Ù†Ø¬Ø§Ø­!</h1>
            <p className="text-gray-500 text-sm mb-6">{message || "Ø³ÙŠØªÙ… ØªØ­ÙˆÙŠÙ„Ùƒ Ø¥Ù„Ù‰ Ø§Ù„Ù…ØªØ¬Ø± ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹..."}</p>
            <Link
              href="/"
              className="bg-primary text-white px-8 py-3 rounded-full font-medium inline-block shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            >
              Ø§Ù„Ø°Ù‡Ø§Ø¨ Ù„Ù„ØªØ³ÙˆÙ‚
            </Link>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 text-primary">
                <MailCheck size={32} />
              </div>
              <h1 className="text-2xl font-bold text-secondary">ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ</h1>
              <p className="text-sm text-gray-500 mt-1">
                Ø£Ø¯Ø®Ù„ÙŠ Ø±Ù…Ø² Ø§Ù„ØªØ­Ù‚Ù‚ (OTP) Ø§Ù„Ù…ÙƒÙˆÙ† Ù…Ù† 6 Ø£Ø±Ù‚Ø§Ù… Ø§Ù„Ù…ÙØ±Ø³Ù„ Ø¥Ù„Ù‰ Ø¨Ø±ÙŠØ¯Ùƒ
              </p>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ø±Ù…Ø² Ø§Ù„ØªØ­Ù‚Ù‚ (6 Ø£Ø±Ù‚Ø§Ù…)</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.trim())}
                  className="w-full text-center tracking-[0.5em] font-mono text-2xl font-bold border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="123456"
                />
              </div>

              {message && status === "error" && (
                <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-primary text-white py-3 rounded-full font-semibold shadow-md shadow-primary/20 hover:bg-primary/95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="animate-spin" size={18} /> Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù‚Ù‚...
                  </>
                ) : (
                  <>
                    ØªØ£ÙƒÙŠØ¯ ÙˆØªÙØ¹ÙŠÙ„ Ø§Ù„Ø­Ø³Ø§Ø¨ <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-xs text-primary font-semibold hover:underline disabled:opacity-50"
              >
                {resending ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„..." : "Ù„Ù… ÙŠØµÙ„Ùƒ Ø§Ù„Ø±Ù…Ø²ØŸ Ø¥Ø¹Ø§Ø¯Ø© Ø¥Ø±Ø³Ø§Ù„ Ø±Ù…Ø² Ø¬Ø¯ÙŠØ¯"}
              </button>
              {resendMsg && <p className="text-xs text-gray-500 mt-2">{resendMsg}</p>}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center py-24 text-gray-400">...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}


