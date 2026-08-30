// src/app/checkout/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { apiClient } from "@/lib/apiClient";
import { Loader2, Copy, Check, Gift, CreditCard, ShieldCheck } from "lucide-react";

interface PaymentMethodOption {
  _id: string;
  name: { ar: string; en: string };
  type: "cod" | "bank_transfer" | "other";
  instructions?: { ar: string; en: string };
}

interface CartItem {
  productId: {
    _id: string;
    name: { ar: string; en: string };
    price: number;
    discountPrice?: number;
    images?: string[];
  };
  quantity: number;
}

export default function CheckoutPage() {
  const { t, lang, user, authLoading, refreshCartCount } = useApp();
  const router = useRouter();

  const [shippingAddress, setShippingAddress] = useState("");
  const [methods, setMethods] = useState<PaymentMethodOption[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [useLoyalty, setUseLoyalty] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  
  // Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø³Ù„Ø© ÙˆØ§Ù„Ø£Ø³Ø¹Ø§Ø±
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);

  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Ø¬Ù„Ø¨ Ø·Ø±Ù‚ Ø§Ù„Ø¯ÙØ¹ØŒ Ø±ØµÙŠØ¯ Ø§Ù„Ù†Ù‚Ø§Ø·ØŒ ÙˆÙ…Ø­ØªÙˆÙŠØ§Øª Ø§Ù„Ø³Ù„Ø©
  useEffect(() => {
    async function loadData() {
      try {
        const [methodsRes, meRes, cartRes] = await Promise.all([
          apiClient("/payment-methods"),
          apiClient("/auth/me").catch(() => null),
          apiClient("/cart").catch(() => null),
        ]);

        setMethods(methodsRes.paymentMethods || []);
        if (methodsRes.paymentMethods?.length > 0) {
          setSelectedMethodId(methodsRes.paymentMethods[0]._id);
        }
        if (meRes?.user?.loyaltyPoints) {
          setUserPoints(meRes.user.loyaltyPoints);
        }
        if (cartRes?.cart?.items) {
          setCartItems(cartRes.cart.items);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setMethodsLoading(false);
        setCartLoading(false);
      }
    }
    loadData();
  }, []);
  
  useEffect(() => {
  if (!authLoading && !user) {
    router.push("/login");
  }
}, [authLoading, user, router]);

if (authLoading) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

if (!user) {
  return null;
}
 
  const selectedMethod = methods.find((m) => m._id === selectedMethodId);

  // Ø­Ø³Ø§Ø¨ Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹ Ø§Ù„ÙØ±Ø¹ÙŠ
  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.productId.discountPrice || item.productId.price;
    return acc + price * item.quantity;
  }, 0);

  // Ø­Ø³Ø§Ø¨ Ù‚ÙŠÙ…Ø© Ø®ØµÙ… Ø§Ù„Ù†Ù‚Ø§Ø· (ÙƒÙ„ Ù†Ù‚Ø·Ø© = 10 Ø¬Ù†ÙŠÙ‡ØŒ Ù…Ø·Ø§Ø¨Ù‚Ø© Ù„Ù„Ù€ Backend)
  const pointValue = 10;
  const maxPointsDiscount = userPoints * pointValue;
  const loyaltyDiscount = useLoyalty ? Math.min(maxPointsDiscount, subtotal) : 0;
  const finalTotal = Math.max(0, subtotal - loyaltyDiscount);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMethodId) {
      setError(lang === "ar" ? "ÙŠØ±Ø¬ÙŠ Ø§Ø®ØªÙŠØ§Ø± Ø·Ø±ÙŠÙ‚Ù‡ Ø§Ù„Ø¯ÙØ¹ " : "Please choose a method to payment");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const orderData = await apiClient("/orders", {
        method: "POST",
        body: JSON.stringify({
          shippingAddress,
          paymentMethodId: selectedMethodId,
          useLoyaltyPoints: useLoyalty,
        }),
      });

      await refreshCartCount();
      router.push(`/order-success?orderId=${orderData.order._id}`);
    } catch (err: unknown) {
      setError((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-8">
        <ShieldCheck className="text-primary" size={28} />
        <h1 className="text-2xl md:text-3xl font-bold text-secondary">{t("checkout")}</h1>
      </div>

      <form onSubmit={handlePlaceOrder} className="space-y-8">
        
        {/* Ù…Ù„Ø®Øµ Ø§Ù„Ø·Ù„Ø¨ ÙˆØ§Ù„Ø£Ø³Ø¹Ø§Ø± */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-secondary mb-4">Ù…Ù„Ø®Øµ Ø§Ù„Ø³Ù„Ø© ÙˆØ§Ù„Ø£Ø³Ø¹Ø§Ø±</h2>
          {cartLoading ? (
            <p className="text-sm text-gray-400">Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ø³Ù„Ø©...</p>
          ) : cartItems.length === 0 ? (
            <p className="text-sm text-red-500">Ø§Ù„Ø³Ù„Ø© ÙØ§Ø±ØºØ©</p>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹ Ø§Ù„ÙØ±Ø¹ÙŠ Ù„Ù„Ù…Ù†ØªØ¬Ø§Øª:</span>
                <span className="font-semibold text-secondary">{subtotal} SDG</span>
              </div>

              {useLoyalty && loyaltyDiscount > 0 && (
                <div className="flex justify-between text-amber-600 font-medium">
                  <span>Ø®ØµÙ… Ù†Ù‚Ø§Ø· Ø§Ù„ÙˆÙ„Ø§Ø¡:</span>
                  <span>- {loyaltyDiscount} SDG</span>
                </div>
              )}

              <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-bold text-secondary">
                <span>Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ Ù„Ù„Ø¯ÙØ¹:</span>
                <span className="text-primary">{finalTotal} SDG</span>
              </div>
            </div>
          )}
        </div>

        {/* Ø¹Ù†ÙˆØ§Ù† Ø§Ù„ØªÙˆØµÙŠÙ„ */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <label className="block text-sm font-bold text-secondary mb-2">
            {t("shippingAddress")} (Ø§Ù„Ù…Ø¯ÙŠÙ†Ø© / Ø§Ù„Ø­ÙŠ / Ø§Ù„Ø´Ø§Ø±Ø¹)
          </label>
          <textarea
            required
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            className="w-full border border-gray-200 rounded-2xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            rows={3}
            placeholder="Ø§Ù„Ø®Ø±Ø·ÙˆÙ…ØŒ Ø§Ù„Ø±ÙŠØ§Ø¶ØŒ Ø´Ø§Ø±Ø¹ Ø§Ù„Ù…Ø´ØªÙ„ØŒ Ù…Ø¹Ù„Ù… Ø¨Ø§Ø±Ø²..."
          />
        </div>

        {/* Ù†Ù‚Ø§Ø· Ø§Ù„ÙˆÙ„Ø§Ø¡ ÙˆØ§Ù„Ù…ÙƒØ§ÙØ¢Øª */}
        {userPoints > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center shrink-0">
                  <Gift size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-secondary text-sm">Ø¨Ø±Ù†Ø§Ù…Ø¬ Ù…ÙƒØ§ÙØ¢Øª Leadybag</h3>
                  <p className="text-xs text-amber-900 mt-0.5">
                    Ø±ØµÙŠØ¯Ùƒ Ø§Ù„Ø­Ø§Ù„ÙŠ: <strong>{userPoints} Ù†Ù‚Ø·Ø©</strong> (ØªØ³Ø§ÙˆÙŠ ØªÙ‚Ø±ÙŠØ¨Ø§Ù‹ <strong>{userPoints * 10} SDG</strong> Ø®ØµÙ… Ù†Ù‚Ø¯ÙŠ)
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-xl border border-amber-300 shadow-sm">
                <input
                  type="checkbox"
                  checked={useLoyalty}
                  onChange={(e) => setUseLoyalty(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <span className="text-xs font-bold text-secondary">Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ù†Ù‚Ø§Ø·</span>
              </label>
            </div>
          </div>
        )}

        {/* Ø·Ø±Ù‚ Ø§Ù„Ø¯ÙØ¹ Ø§Ù„Ù…Ø­Ù„ÙŠØ© Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø© ÙÙŠ Ø§Ù„Ø³ÙˆØ¯Ø§Ù† */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <label className="text-sm font-bold text-secondary mb-4 flex items-center gap-2">
            <CreditCard size={18} className="text-primary" />
            {t("paymentMethod")} (Ø§Ù„Ø³ÙˆØ¯Ø§Ù†)
          </label>

          {methodsLoading ? (
            <p className="text-sm text-gray-400 flex items-center gap-2 py-4">
              <Loader2 className="animate-spin text-primary" size={18} /> {t("loading")}
            </p>
          ) : methods.length === 0 ? (
            <p className="text-sm text-red-500">
              {lang === "ar"
                ? "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ø±Ù‚ Ø¯ÙØ¹ Ù…ØªØ§Ø­Ø© Ø­Ø§Ù„ÙŠØ§Ù‹ØŒ ÙŠØ±Ø¬Ù‰ Ø§Ù„ØªÙˆØ§ØµÙ„ Ù…Ø¹ Ø§Ù„Ù…ØªØ¬Ø±"
                : "No payment methods are available right now, please contact the store"}
            </p>
          ) : (
            <div className="space-y-3">
              {methods.map((m) => (
                <label
                  key={m._id}
                  className={`flex items-center justify-between border rounded-2xl p-4 cursor-pointer transition-all ${
                    selectedMethodId === m._id
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={m._id}
                      checked={selectedMethodId === m._id}
                      onChange={() => setSelectedMethodId(m._id)}
                      className="text-primary focus:ring-primary w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold text-sm text-secondary block">{m.name[lang]}</span>
                      <span className="text-xs text-gray-500">
                        {m.type === "bank_transfer" ? "ØªØ­ÙˆÙŠÙ„ Ø¹Ø¨Ø± ØªØ·Ø¨ÙŠÙ‚ Ø¨Ù†ÙƒÙƒ (Bank of Khartoum)" : m.type === "cod" ? "Ø§Ù„Ø¯ÙØ¹ Ù†Ù‚Ø¯Ø§Ù‹ Ø£Ùˆ ØªØ­ÙˆÙŠÙ„ Ø¹Ù†Ø¯ Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù…" : "Ø¯ÙØ¹ ÙÙˆØ±ÙŠ"}
                      </span>
                    </div>
                  </div>
                  {m.type === "bank_transfer" && (
                    <span className="text-[11px] bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full">
                      Ù…ÙˆØµÙ‰ Ø¨Ù‡ ÙÙŠ Ø§Ù„Ø³ÙˆØ¯Ø§Ù†
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}

          {/* ØªØ¹Ù„ÙŠÙ…Ø§Øª Ø§Ù„Ø¯ÙØ¹ ÙˆØ²Ø± Ù†Ø³Ø® Ø±Ù‚Ù… Ø§Ù„Ø­Ø³Ø§Ø¨ Ù„Ø¨Ù†ÙƒÙƒ */}
          {selectedMethod?.type !== "cod" && selectedMethod?.instructions?.[lang] && (
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-secondary">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-gray-500 uppercase tracking-wider">Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ØªØ­ÙˆÙŠÙ„:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(selectedMethod.instructions![lang])}
                  className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-green-600" /> ØªÙ… Ø§Ù„Ù†Ø³Ø®!
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Ù†Ø³Ø® Ø§Ù„ØªØ¹Ù„ÙŠÙ…Ø§Øª / Ø§Ù„Ø­Ø³Ø§Ø¨
                    </>
                  )}
                </button>
              </div>
              <div className="whitespace-pre-line text-xs font-mono bg-white p-3 rounded-xl border border-gray-200 text-gray-700">
                {selectedMethod.instructions[lang]}
              </div>
              <p className="text-[11px] text-gray-500 mt-2">
                * ÙŠÙ…ÙƒÙ†Ùƒ Ø¥Ø±ÙØ§Ù‚ ØµÙˆØ±Ø© Ø¥Ø´Ø¹Ø§Ø± Ø§Ù„ØªØ­ÙˆÙŠÙ„ ÙˆØ±Ù‚Ù… Ø§Ù„Ù…Ø¹Ø§Ù…Ù„Ø© Ù…Ø¨Ø§Ø´Ø±Ø© ÙÙŠ Ø§Ù„ØµÙØ­Ø© Ø§Ù„ØªØ§Ù„ÙŠØ© Ø¨Ø¹Ø¯ ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø·Ù„Ø¨.
              </p>
            </div>
          )}
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm p-4 rounded-2xl border border-red-100">{error}</div>}

        <button
          type="submit"
          disabled={loading || methods.length === 0}
          className="w-full bg-primary text-white py-4 rounded-full font-bold text-base shadow-xl shadow-primary/25 hover:bg-primary/95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} /> Ø¬Ø§Ø±ÙŠ Ù…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„Ø·Ù„Ø¨...
            </>
          ) : (
            t("placeOrder")
          )}
        </button>
      </form>
    </main>
  );
}

