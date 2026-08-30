// src/app/admin/looks/page.tsx
"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import ImageUploader from "@/components/ImageUploader";
import { Plus, Trash2, Edit2, X, Sparkles, Check, Package, ExternalLink } from "lucide-react";

interface ProductOption {
  _id: string;
  name: { ar: string; en: string };
  price: number;
  discountPrice?: number;
  images: string[];
}

export default function AdminLooksPage() {
  const [looks, setLooks] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  // Ø­Ù‚ÙˆÙ„ Ø§Ù„Ù†Ù…ÙˆØ°Ø¬
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [slug, setSlug] = useState("");
  const [descAr, setDescAr] = useState("");
  const [descEn, setDescEn] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [bundlePrice, setBundlePrice] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [looksRes, productsRes] = await Promise.all([
        apiClient("/looks").catch(() => ({ looks: [] })),
        apiClient("/products?limit=100").catch(() => ({ products: [] })),
      ]);
      setLooks(looksRes.looks || []);
      setAllProducts(productsRes.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setTitleAr("");
    setTitleEn("");
    setSlug("");
    setDescAr("");
    setDescEn("");
    setImageUrl("");
    setBundlePrice("");
    setSelectedProductIds([]);
    setIsActive(true);
    setEditingSlug(null);
    setShowForm(false);
    setError("");
  }

  function startEdit(look: any) {
    setEditingSlug(look.slug);
    setTitleAr(look.title?.ar || "");
    setTitleEn(look.title?.en || "");
    setSlug(look.slug || "");
    setDescAr(look.description?.ar || "");
    setDescEn(look.description?.en || "");
    setImageUrl(look.imageUrl || "");
    setBundlePrice(String(look.bundlePrice || ""));
    setSelectedProductIds(look.products?.map((p: any) => (typeof p === "string" ? p : p._id)) || []);
    setIsActive(look.isActive ?? true);
    setShowForm(true);
  }

  function toggleProductSelection(productId: string) {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (selectedProductIds.length === 0) {
      setError("ÙŠØ±Ø¬Ù‰ Ø§Ø®ØªÙŠØ§Ø± Ù…Ù†ØªØ¬ ÙˆØ§Ø­Ø¯ Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„ Ù„ØªÙ†Ø³ÙŠÙ‚ Ù‡Ø°Ù‡ Ø§Ù„Ø¥Ø·Ù„Ø§Ù„Ø©");
      setSaving(false);
      return;
    }

    const payload = {
      title: { ar: titleAr, en: titleEn },
      slug,
      description: { ar: descAr, en: descEn },
      imageUrl,
      bundlePrice: Number(bundlePrice),
      products: selectedProductIds,
      isActive,
    };

    try {
      if (editingSlug) {
        await apiClient(`/looks/${editingSlug}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient("/looks", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      await loadData();
    } catch (err: unknown) {
      setError((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(lookSlug: string) {
    if (!confirm("Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø­Ø°Ù Ù‡Ø°Ù‡ Ø§Ù„Ø¥Ø·Ù„Ø§Ù„Ø©ØŸ")) return;
    try {
      await apiClient(`/looks/${lookSlug}`, { method: "DELETE" });
      await loadData();
    } catch (err: unknown) {
      alert((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    }
  }

  // Ø­Ø³Ø§Ø¨ Ù…Ø¬Ù…ÙˆØ¹ Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ø§Ù„Ù…Ø®ØªØ§Ø±Ø© Ù„Ù…Ø³Ø§Ø¹Ø¯Ø© Ø§Ù„Ø£Ø¯Ù…Ù† Ø¹Ù„Ù‰ ØªØ­Ø¯ÙŠØ¯ Ø³Ø¹Ø± Ø§Ù„Ø­Ø²Ù…Ø© Ø§Ù„Ù…Ù†Ø§Ø³Ø¨
  const selectedProductsSum = allProducts
    .filter((p) => selectedProductIds.includes(p._id))
    .reduce((sum, p) => sum + (p.discountPrice || p.price), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary flex items-center gap-2">
            <Sparkles className="text-primary" size={24} />
            ØªÙ†Ø³ÙŠÙ‚ Ø§Ù„Ø¥Ø·Ù„Ø§Ù„Ø§Øª Ø§Ù„ÙƒØ§Ù…Ù„Ø© (Shop the Look)
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Ù‚ÙˆÙ…ÙŠ Ø¨ØªØ¬Ù…ÙŠØ¹ Ø­Ù‚ÙŠØ¨Ø© Ù…Ø¹ Ø­Ø°Ø§Ø¡ ÙˆØ¥ÙƒØ³Ø³ÙˆØ§Ø±Ø§Øª Ù…ØªÙ†Ø§Ø³Ù‚Ø© ÙÙŠ Ø¥Ø·Ù„Ø§Ù„Ø© ÙˆØ§Ø­Ø¯Ø© Ø¨Ø³Ø¹Ø± Ø­Ø²Ù…Ø© Ø®Ø§Øµ
          </p>
        </div>
        <button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-1.5 shadow-md shadow-primary/20 hover:bg-primary/95 transition-all"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Ø¥Ù„ØºØ§Ø¡" : "Ø¥Ø¶Ø§ÙØ© Ø¥Ø·Ù„Ø§Ù„Ø© Ø¬Ø¯ÙŠØ¯Ø©"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-3xl p-6 mb-8 shadow-sm space-y-6 max-w-3xl">
          <h2 className="font-bold text-secondary text-base border-b pb-3">
            {editingSlug ? "ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ø¥Ø·Ù„Ø§Ù„Ø©" : "Ø¥Ù†Ø´Ø§Ø¡ Ø¥Ø·Ù„Ø§Ù„Ø© Ù…Ù†Ø³Ù‚Ø© Ø¬Ø¯ÙŠØ¯Ø©"}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Ø§Ø³Ù… Ø§Ù„Ø¥Ø·Ù„Ø§Ù„Ø© (Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©)</label>
              <input
                required
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                placeholder="Ø¥Ø·Ù„Ø§Ù„Ø© Ø§Ù„Ø³Ù‡Ø±Ø© Ø§Ù„ÙƒÙ„Ø§Ø³ÙŠÙƒÙŠØ©"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Ø§Ø³Ù… Ø§Ù„Ø¥Ø·Ù„Ø§Ù„Ø© (Ø¨Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©)</label>
              <input
                required
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="Classic Evening Look"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Ø§Ù„Ø±Ø§Ø¨Ø· (Slug - Ø¨Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© ÙˆØ¨Ø¯ÙˆÙ† Ù…Ø³Ø§ÙØ§Øª)
            </label>
            <input
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              placeholder="classic-evening-look"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm font-mono focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">ÙˆØµÙ Ø§Ù„Ø¥Ø·Ù„Ø§Ù„Ø© (Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©)</label>
              <textarea
                rows={2}
                value={descAr}
                onChange={(e) => setDescAr(e.target.value)}
                placeholder="Ø­Ù‚ÙŠØ¨Ø© Ø¬Ù„Ø¯ÙŠØ© ÙØ§Ø®Ø±Ø© Ù…Ø¹ Ø­Ø°Ø§Ø¡ ÙƒÙ„Ø§Ø³ÙŠÙƒÙŠ Ø£Ù†ÙŠÙ‚ Ù„Ù…Ù†Ø§Ø³Ø¨Ø§ØªÙƒ Ø§Ù„Ø®Ø§ØµØ©..."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">ÙˆØµÙ Ø§Ù„Ø¥Ø·Ù„Ø§Ù„Ø© (Ø¨Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©)</label>
              <textarea
                rows={2}
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                placeholder="Luxury leather bag with matching elegant heels..."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none"
              />
            </div>
          </div>

          {/* ØµÙˆØ±Ø© Ø§Ù„Ø¥Ø·Ù„Ø§Ù„Ø© Ø§Ù„Ù…Ù†Ø³Ù‚Ø© */}
          <div>
            <ImageUploader currentUrl={imageUrl} onUploaded={setImageUrl} label="ØµÙˆØ±Ø©  Ø§Ù„Ø¥Ø·Ù„Ø§Ù„Ø© Ø§Ù„ÙƒØ§Ù…Ù„Ø©" folder="looks" />
            <p className="text-[11px] text-gray-400 mt-1">
              ØµÙˆØ±Ø© Ø§Ø­ØªØ±Ø§ÙÙŠØ© ØªÙØ¸Ù‡Ø± Ø§Ù„Ø¹Ø§Ø±Ø¶Ø© Ø£Ùˆ Ø§Ù„Ù‚Ø·Ø¹ Ù…Ø¬Ù…Ø¹Ø© Ù…Ø¹Ø§Ù‹
            </p>
          </div>

          {/* ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ø§Ù„Ù…ÙƒÙˆÙ†Ø© Ù„Ù„Ø¥Ø·Ù„Ø§Ù„Ø© */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-sm font-bold text-secondary">Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ø§Ù„Ù…ÙƒÙˆÙ‘Ù†Ø© Ù„Ù„Ø¥Ø·Ù„Ø§Ù„Ø©</label>
                <p className="text-xs text-gray-400">Ø§Ù†Ù‚Ø±ÙŠ Ø¹Ù„Ù‰ Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ù„Ø¥Ø¶Ø§ÙØªÙ‡Ø§ Ø£Ùˆ Ø§Ø³ØªØ¨Ø¹Ø§Ø¯Ù‡Ø§ Ù…Ù† Ø§Ù„Ø­Ø²Ù…Ø©</p>
              </div>
              <span className="text-xs bg-rose-50 text-primary font-bold px-3 py-1 rounded-full border border-rose-100">
                Ø§Ù„Ù…Ø­Ø¯Ø¯: {selectedProductIds.length} Ù…Ù†ØªØ¬Ø§Øª (Ù…Ø¬Ù…ÙˆØ¹Ù‡Ø§: {selectedProductsSum} SDG)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded-2xl border border-gray-100">
              {allProducts.map((prod) => {
                const isSelected = selectedProductIds.includes(prod._id);
                return (
                  <div
                    key={prod._id}
                    onClick={() => toggleProductSelection(prod._id)}
                    className={`cursor-pointer p-2.5 rounded-xl border text-xs transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-white border-primary ring-2 ring-primary/40 shadow-sm"
                        : "bg-white border-gray-200 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-1 relative">
                      {prod.images?.[0] ? (
                        <img src={prod.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : null}
                      {isSelected && (
                        <div className="absolute top-1 end-1 bg-primary text-white p-0.5 rounded-full">
                          <Check size={12} />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-secondary truncate">{prod.name.ar}</p>
                      <p className="text-primary font-bold">{prod.discountPrice || prod.price} SDG</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ø³Ø¹Ø± Ø§Ù„Ø­Ø²Ù…Ø© ÙˆØ§Ù„Ø¹Ø±Ø¶ Ø§Ù„Ø®Ø§Øµ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Ø³Ø¹Ø± Ø§Ù„Ø­Ø²Ù…Ø© Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ù„Ù„Ø¥Ø·Ù„Ø§Ù„Ø© (SDG)
              </label>
              <input
                type="number"
                required
                min={0}
                value={bundlePrice}
                onChange={(e) => setBundlePrice(e.target.value)}
                placeholder="Ù…Ø«Ø§Ù„: 35000"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold text-primary focus:ring-1 focus:ring-primary outline-none"
              />
              {Number(bundlePrice) > 0 && selectedProductsSum > Number(bundlePrice) && (
                <p className="text-[11px] text-green-600 font-semibold mt-1">
                  ÙˆÙØ± Ø§Ù„Ø¹Ù…ÙŠÙ„: {selectedProductsSum - Number(bundlePrice)} SDG âœ“
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <span className="text-sm font-semibold text-secondary">ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø¥Ø·Ù„Ø§Ù„Ø© ÙˆØ¹Ø±Ø¶Ù‡Ø§ ÙÙŠ Ø§Ù„Ù…ØªØ¬Ø±</span>
              </label>
            </div>
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary text-white py-3 rounded-full text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/95 disabled:opacity-50 transition-all"
          >
            {saving ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø­ÙØ¸..." : editingSlug ? "Ø­ÙØ¸ ØªØ¹Ø¯ÙŠÙ„Ø§Øª Ø§Ù„Ø¥Ø·Ù„Ø§Ù„Ø©" : "Ù†Ø´Ø± Ø§Ù„Ø¥Ø·Ù„Ø§Ù„Ø© Ø§Ù„Ø¢Ù†"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400">Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„...</p>
      ) : looks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8 shadow-xs">
          <Sparkles className="mx-auto text-primary mb-3" size={40} />
          <h3 className="font-bold text-secondary text-base mb-1">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¥Ø·Ù„Ø§Ù„Ø§Øª Ù…Ù†Ø³Ù‚Ø© Ø¨Ø¹Ø¯</h3>
          <p className="text-xs text-gray-400 mb-4">
            Ø§Ø¨Ø¯Ø£ÙŠ Ø¨ØªÙ†Ø³ÙŠÙ‚ Ø£ÙˆÙ„ Ø¥Ø·Ù„Ø§Ù„Ø© Ù„Ø²Ø¨Ø§Ø¦Ù†Ùƒ Ø¨Ø¯Ù…Ø¬ Ø§Ù„Ø­Ù‚Ø§Ø¦Ø¨ Ù…Ø¹ Ø§Ù„Ø£Ø­Ø°ÙŠØ© ÙˆØ§Ù„Ø¥ÙƒØ³Ø³ÙˆØ§Ø±Ø§Øª
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-md shadow-primary/20"
          >
            Ø¥Ù†Ø´Ø§Ø¡ Ø£ÙˆÙ„ Ø¥Ø·Ù„Ø§Ù„Ø©
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {looks.map((look) => (
            <div key={look._id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm flex flex-col justify-between">
              <div>
                <div className="aspect-[4/3] bg-gray-100 relative">
                  <img src={look.imageUrl} alt="" className="w-full h-full object-cover" />
                  <span
                    className={`absolute top-3 start-3 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      look.isActive ? "bg-green-500 text-white" : "bg-gray-500 text-white"
                    }`}
                  >
                    {look.isActive ? "Ù…ÙØ¹Ù„Ø© ÙÙŠ Ø§Ù„Ù…ØªØ¬Ø±" : "ØºÙŠØ± Ù…ÙØ¹Ù„Ø©"}
                  </span>
                  <span className="absolute top-3 end-3 bg-secondary/80 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-xs">
                    {look.products?.length || 0} Ù‚Ø·Ø¹
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-secondary text-base mb-1">{look.title?.ar}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{look.description?.ar}</p>

                  <div className="flex items-baseline justify-between border-t border-gray-100 pt-3">
                    <div>
                      <span className="text-primary font-black text-lg">{look.bundlePrice} SDG</span>
                      {look.originalTotal > look.bundlePrice && (
                        <span className="text-xs text-gray-400 line-through ms-2">{look.originalTotal} SDG</span>
                      )}
                    </div>
                    <span className="text-[11px] bg-rose-50 text-primary font-bold px-2.5 py-0.5 rounded-full">
                      ÙˆÙØ± {Math.max(0, (look.originalTotal || 0) - look.bundlePrice)} SDG
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 flex gap-2 border-t border-gray-50 mt-2">
                <button
                  onClick={() => startEdit(look)}
                  className="flex-1 bg-gray-50 hover:bg-gray-100 text-secondary py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Edit2 size={13} /> ØªØ¹Ø¯ÙŠÙ„
                </button>
                <button
                  onClick={() => handleDelete(look.slug)}
                  className="px-3 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors"
                  title="Ø­Ø°Ù"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


