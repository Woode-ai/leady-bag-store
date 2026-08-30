// src/components/WhatsAppButton.tsx
// زر واتساب عائم يظهر لكل زوار الموقع (بخلاف زر الدردشة الذي يظهر فقط للعملاء المسجلين دخولهم)
// - على الموبايل: نقل مباشر لمحادثة واتساب عبر رابط wa.me
// - على الكمبيوتر: نافذة صغيرة تعرض رمز QR (الذي رفعه الأدمن، أو رمز يُولَّد تلقائياً كبديل احتياطي
//   من نفس رقم الواتساب في حال لم يرفع الأدمن صورة بعد) ليمسحه العميل بهاتفه
//
// لا يظهر الزر إطلاقاً إذا لم يُدخل الأدمن رقم واتساب من لوحة التحكم (/admin/settings)

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

  // رابط محادثة واتساب المباشر - فارغ طالما لا يوجد رقم بعد
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

  // نولّد رمز QR بديلاً محلياً في المتصفح فقط إذا كان هناك رقم واتساب لكن الأدمن لم يرفع صورة رمز بعد
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

  if (!whatsappNumber) return null; // الأدمن لم يُعِدّ رقم واتساب بعد - لا نعرض زراً معطلاً بلا فائدة

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
      {/* موضوع فوق زر الدردشة مباشرة (bottom-24) حتى لا يتداخلا مع بعض إن ظهر الاثنان معاً */}
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
              {lang === "ar" ? "تواصل معنا عبر واتساب" : "Chat with us on WhatsApp"}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {lang === "ar"
                ? "امسح الرمز بكاميرا هاتفك لبدء المحادثة مباشرة"
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
                {lang === "ar" ? "جاري توليد الرمز..." : "Generating code..."}
              </div>
            )}

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm text-primary underline"
            >
              {lang === "ar" ? "أو افتح المحادثة مباشرة" : "Or open the chat directly"}
            </a>
          </div>
        </div>
      )}
    </>
  );
}


