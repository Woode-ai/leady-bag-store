// src/components/ProductForm.tsx
// Ù†Ù…ÙˆØ°Ø¬ ÙƒØ§Ù…Ù„ Ù„Ø¥Ø¶Ø§ÙØ© Ø£Ùˆ ØªØ¹Ø¯ÙŠÙ„ Ù…Ù†ØªØ¬ - ÙŠÙØ³ØªØ®Ø¯Ù… ÙÙŠ ØµÙØ­ØªÙŠ:
// /admin/products/new  Ùˆ  /admin/products/[id]/edit
// Ù†Ù…Ø±Ø± Ù„Ù‡ initialData Ø¹Ù†Ø¯ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„ØŒ Ø£Ùˆ Ù†ØªØ±ÙƒÙ‡ ÙØ§Ø±ØºØ§Ù‹ Ø¹Ù†Ø¯ Ø§Ù„Ø¥Ø¶Ø§ÙØ©

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import ImageUploader from "@/components/ImageUploader";
import { X } from "lucide-react";

interface Category {
  _id: string;
  name: { ar: string; en: string };
}

interface ProductFormProps {
  productId?: string; // Ø¥Ù† ÙˆÙØ¬Ø¯ØŒ ÙÙ‡Ø°Ø§ ØªØ¹Ø¯ÙŠÙ„ ÙˆÙ„ÙŠØ³ Ø¥Ø¶Ø§ÙØ©
  initialData?: any;
}

export default function ProductForm({ productId, initialData }: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  const [nameAr, setNameAr] = useState(initialData?.name?.ar || "");
  const [nameEn, setNameEn] = useState(initialData?.name?.en || "");
  const [descAr, setDescAr] = useState(initialData?.description?.ar || "");
  const [descEn, setDescEn] = useState(initialData?.description?.en || "");
  const [price, setPrice] = useState(initialData?.price?.toString() || "");
  const [discountPrice, setDiscountPrice] = useState(initialData?.discountPrice?.toString() || "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId?._id || initialData?.categoryId || "");
  const [stock, setStock] = useState(initialData?.stock?.toString() || "0");
  const [colors, setColors] = useState(initialData?.colors?.join(", ") || "");
  const [sizes, setSizes] = useState(initialData?.sizes?.join(", ") || "");
  const [images, setImages] = useState<string[]>(initialData?.images || []);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient("/categories")
      .then((data) => setCategories(data.categories))
      .catch(console.error);
  }, []);

  function addImage(url: string) {
    setImages((prev) => [...prev, url]);
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: { ar: nameAr, en: nameEn },
      description: { ar: descAr, en: descEn },
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      categoryId,
      stock: Number(stock),
      colors: colors ? colors.split(",").map((c: string) => c.trim()).filter(Boolean) : [],
      sizes: sizes ? sizes.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      images,
    };

    try {
      if (productId) {
        await apiClient(`/products/${productId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient("/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      router.push("/admin/products");
    } catch (err: unknown) {
      setError((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Ø§Ù„Ø§Ø³Ù… Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©</label>
          <input
            required
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Ø§Ù„Ø§Ø³Ù… Ø¨Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©</label>
          <input
            required
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Ø§Ù„ÙˆØµÙ Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©</label>
          <textarea
            required
            value={descAr}
            onChange={(e) => setDescAr(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Ø§Ù„ÙˆØµÙ Ø¨Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©</label>
          <textarea
            required
            value={descEn}
            onChange={(e) => setDescEn(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            rows={3}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Ø§Ù„Ø³Ø¹Ø±</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            Ø³Ø¹Ø± Ø§Ù„Ø®ØµÙ… (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={discountPrice}
            onChange={(e) => setDiscountPrice(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Ø§Ù„ÙƒÙ…ÙŠØ© Ø¨Ø§Ù„Ù…Ø®Ø²ÙˆÙ†</label>
          <input
            required
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary mb-1">Ø§Ù„Ù‚Ø³Ù…</label>
        <select
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-2 text-sm"
        >
          <option value="">-- Ø§Ø®ØªØ± Ù‚Ø³Ù…Ø§Ù‹ --</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name.ar}
            </option>
          ))}
        </select>
        {categories.length === 0 && (
          <p className="text-xs text-yellow-600 mt-1">
            Ù„Ø§ ØªÙˆØ¬Ø¯ Ø£Ù‚Ø³Ø§Ù… Ø¨Ø¹Ø¯ - Ø£Ø¶Ù Ù‚Ø³Ù…Ø§Ù‹ Ø£ÙˆÙ„Ø§Ù‹ Ù…Ù† ØµÙØ­Ø© Ø§Ù„Ø£Ù‚Ø³Ø§Ù…
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            Ø§Ù„Ø£Ù„ÙˆØ§Ù† (Ø§ÙØµÙ„ Ø¨ÙŠÙ†Ù‡Ø§ Ø¨ÙØ§ØµÙ„Ø©)
          </label>
          <input
            value={colors}
            onChange={(e) => setColors(e.target.value)}
            placeholder="Ø£Ø³ÙˆØ¯, Ø¨Ù†ÙŠ, Ø£Ø­Ù…Ø±"
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            Ø§Ù„Ù…Ù‚Ø§Ø³Ø§Øª (Ø§ÙØµÙ„ Ø¨ÙŠÙ†Ù‡Ø§ Ø¨ÙØ§ØµÙ„Ø©)
          </label>
          <input
            value={sizes}
            onChange={(e) => setSizes(e.target.value)}
            placeholder="S, M, L"
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary mb-2">ØµÙˆØ± Ø§Ù„Ù…Ù†ØªØ¬</label>
        <div className="flex flex-wrap gap-3 mb-3">
          {images.map((img, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300">
              <img src={img} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-0.5 end-0.5 bg-black/60 text-white rounded-full p-0.5"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        <ImageUploader onUploaded={addImage} label="Ø£Ø¶Ù ØµÙˆØ±Ø© Ø¬Ø¯ÙŠØ¯Ø©" />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-primary text-white px-6 py-2.5 rounded-full text-sm disabled:opacity-50"
      >
        {saving ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø­ÙØ¸..." : productId ? "Ø­ÙØ¸ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„Ø§Øª" : "Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ù…Ù†ØªØ¬"}
      </button>
    </form>
  );
}


