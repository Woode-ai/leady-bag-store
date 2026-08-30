// src/components/WhatsAppButton.tsx
// Ø²Ø± ÙˆØ§ØªØ³Ø§Ø¨ Ø¹Ø§Ø¦Ù… ÙŠØ¸Ù‡Ø± Ù„ÙƒÙ„ Ø²ÙˆØ§Ø± Ø§Ù„Ù…ÙˆÙ‚Ø¹ (Ø¨Ø®Ù„Ø§Ù Ø²Ø± Ø§Ù„Ø¯Ø±Ø¯Ø´Ø© Ø§Ù„Ø°ÙŠ ÙŠØ¸Ù‡Ø± ÙÙ‚Ø· Ù„Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ù…Ø³Ø¬Ù„ÙŠÙ† Ø¯Ø®ÙˆÙ„Ù‡Ù…)
// - Ø¹Ù„Ù‰ Ø§Ù„Ù…ÙˆØ¨Ø§ÙŠÙ„: Ù†Ù‚Ù„ Ù…Ø¨Ø§Ø´Ø± Ù„Ù…Ø­Ø§Ø¯Ø«Ø© ÙˆØ§ØªØ³Ø§Ø¨ Ø¹Ø¨Ø± Ø±Ø§Ø¨Ø· wa.me
// - Ø¹Ù„Ù‰ Ø§Ù„ÙƒÙ…Ø¨ÙŠÙˆØªØ±: Ù†Ø§ÙØ°Ø© ØµØºÙŠØ±Ø© ØªØ¹Ø±Ø¶ Ø±Ù…Ø² QR (Ø§Ù„Ø°ÙŠ Ø±ÙØ¹Ù‡ Ø§Ù„Ø£Ø¯Ù…Ù†ØŒ Ø£Ùˆ Ø±Ù…Ø² ÙŠÙÙˆÙ„ÙŽÙ‘Ø¯ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ ÙƒØ¨Ø¯ÙŠÙ„ Ø§Ø­ØªÙŠØ§Ø·ÙŠ
//   Ù…Ù† Ù†ÙØ³ Ø±Ù‚Ù… Ø§Ù„ÙˆØ§ØªØ³Ø§Ø¨ ÙÙŠ Ø­Ø§Ù„ Ù„Ù… ÙŠØ±ÙØ¹ Ø§Ù„Ø£Ø¯Ù…Ù† ØµÙˆØ±Ø© Ø¨Ø¹Ø¯) Ù„ÙŠÙ…Ø³Ø­Ù‡ Ø§Ù„Ø¹Ù…ÙŠÙ„ Ø¨Ù‡Ø§ØªÙÙ‡
//
// Ù„Ø§ ÙŠØ¸Ù‡Ø± Ø§Ù„Ø²Ø± Ø¥Ø·Ù„Ø§Ù‚Ø§Ù‹ Ø¥Ø°Ø§ Ù„Ù… ÙŠÙØ¯Ø®Ù„ Ø§Ù„Ø£Ø¯Ù…Ù† Ø±Ù‚Ù… ÙˆØ§ØªØ³Ø§Ø¨ Ù…Ù† Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ… (/admin/settings)

"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { apiClient } from "@/lib/apiClient";
import { MessageSquare, X } from "lucide-react";

export default function WhatsAppButton() {
  const { lang } = useApp();
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappQrImage, setWhatsappQrImage] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [generatedQr, setGeneratedQr] = useState("");

  // Ø±Ø§Ø¨Ø· Ù…Ø­Ø§Ø¯Ø«Ø© ÙˆØ§ØªØ³Ø§Ø¨ Ø§Ù„Ù…Ø¨Ø§Ø´Ø± - ÙØ§Ø±Øº Ø·Ø§Ù„Ù…Ø§ Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø±Ù‚Ù… Ø¨Ø¹Ø¯
  const waLink = whatsappNumber ? `https://wa.me/${whatsappNumber}` : "";

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await apiClient("/settings");
        setWhatsappNumber(data.settings.whatsappNumber || "");
        setWhatsappQrImage(data.settings.whatsappQrImage || "");
      } catch (err) {
        console.error(err);
      }
    }
    loadSettings();
  }, []);

  // Ù†ÙˆÙ„Ù‘Ø¯ Ø±Ù…Ø² QR Ø¨Ø¯ÙŠÙ„Ø§Ù‹ Ù…Ø­Ù„ÙŠØ§Ù‹ ÙÙŠ Ø§Ù„Ù…ØªØµÙØ­ ÙÙ‚Ø· Ø¥Ø°Ø§ ÙƒØ§Ù† Ù‡Ù†Ø§Ùƒ Ø±Ù‚Ù… ÙˆØ§ØªØ³Ø§Ø¨ Ù„ÙƒÙ† Ø§Ù„Ø£Ø¯Ù…Ù† Ù„Ù… ÙŠØ±ÙØ¹ ØµÙˆØ±Ø© Ø±Ù…Ø² Ø¨Ø¹Ø¯
  useEffect(() => {
    if (!showQr || whatsappQrImage || !waLink) return;

    let cancelled = false;
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(waLink, { width: 220, margin: 1 }).then((url) => {
        if (!cancelled) setGeneratedQr(url);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [showQr, whatsappQrImage, waLink]);

  if (!whatsappNumber) return null; // Ø§Ù„Ø£Ø¯Ù…Ù† Ù„Ù… ÙŠÙØ¹ÙØ¯Ù‘ Ø±Ù‚Ù… ÙˆØ§ØªØ³Ø§Ø¨ Ø¨Ø¹Ø¯ - Ù„Ø§ Ù†Ø¹Ø±Ø¶ Ø²Ø±Ø§Ù‹ Ù…Ø¹Ø·Ù„Ø§Ù‹ Ø¨Ù„Ø§ ÙØ§Ø¦Ø¯Ø©

  function isMobileDevice() {
    if (typeof navigator === "undefined") return false;
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  }

  function handleClick() {
    if (isMobileDevice()) {
      window.open(waLink, "_blank", "noopener,noreferrer");
    } else {
      setShowQr(true);
    }
  }

  const qrImageToShow = whatsappQrImage || generatedQr;

  return (
    <>
      {/* Ù…ÙˆØ¶ÙˆØ¹ ÙÙˆÙ‚ Ø²Ø± Ø§Ù„Ø¯Ø±Ø¯Ø´Ø© Ù…Ø¨Ø§Ø´Ø±Ø© (bottom-24) Ø­ØªÙ‰ Ù„Ø§ ÙŠØªØ¯Ø§Ø®Ù„Ø§ Ù…Ø¹ Ø¨Ø¹Ø¶ Ø¥Ù† Ø¸Ù‡Ø± Ø§Ù„Ø§Ø«Ù†Ø§Ù† Ù…Ø¹Ø§Ù‹ */}
      <div className="fixed bottom-24 end-4 z-50">
        <button
          onClick={handleClick}
          aria-label="WhatsApp"
          className="bg-[#25D366] text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:opacity-90"
        >
          <MessageSquare size={24} fill="currentColor" />
        </button>
      </div>

      {showQr && (
        <div
          className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowQr(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQr(false)}
              className="absolute top-3 end-3 text-gray-400 hover:text-gray-600"
              aria-label="close"
            >
              <X size={20} />
            </button>

            <h3 className="font-bold text-secondary mb-1">
              {lang === "ar" ? "ØªÙˆØ§ØµÙ„ Ù…Ø¹Ù†Ø§ Ø¹Ø¨Ø± ÙˆØ§ØªØ³Ø§Ø¨" : "Chat with us on WhatsApp"}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {lang === "ar"
                ? "Ø§Ù…Ø³Ø­ Ø§Ù„Ø±Ù…Ø² Ø¨ÙƒØ§Ù…ÙŠØ±Ø§ Ù‡Ø§ØªÙÙƒ Ù„Ø¨Ø¯Ø¡ Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø© Ù…Ø¨Ø§Ø´Ø±Ø©"
                : "Scan the code with your phone camera to start the chat"}
            </p>

            {qrImageToShow ? (
              <img
                src={qrImageToShow}
                alt="WhatsApp QR"
                className="w-48 h-48 mx-auto rounded-lg border border-gray-100"
              />
            ) : (
              <div className="w-48 h-48 mx-auto rounded-lg border border-gray-100 flex items-center justify-center text-xs text-gray-400">
                {lang === "ar" ? "Ø¬Ø§Ø±ÙŠ ØªÙˆÙ„ÙŠØ¯ Ø§Ù„Ø±Ù…Ø²..." : "Generating code..."}
              </div>
            )}

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm text-primary underline"
            >
              {lang === "ar" ? "Ø£Ùˆ Ø§ÙØªØ­ Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø© Ù…Ø¨Ø§Ø´Ø±Ø©" : "Or open the chat directly"}
            </a>
          </div>
        </div>
      )}
    </>
  );
}


