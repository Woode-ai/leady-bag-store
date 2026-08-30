// src/app/admin/categories/page.tsx
"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import ImageUploader from "@/components/ImageUploader";
import { Plus, Trash2, Edit2, X } from "lucide-react";

interface Category {
  _id: string;
  name: { ar: string; en: string };
  slug: string;
  image?: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    try {
      const data = await apiClient("/categories");
      setCategories(data.categories);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setNameAr("");
    setNameEn("");
    setSlug("");
    setImage("");
    setEditingId(null);
    setShowForm(false);
    setError("");
  }

  function startEdit(cat: Category) {
    setEditingId(cat._id);
    setNameAr(cat.name.ar);
    setNameEn(cat.name.en);
    setSlug(cat.slug);
    setImage(cat.image || "");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = { name: { ar: nameAr, en: nameEn }, slug, image };

    try {
      if (editingId) {
        await apiClient(`/categories/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient("/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      await loadCategories();
    } catch (err: unknown) {
      setError((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø­Ø°Ù Ù‡Ø°Ø§ Ø§Ù„Ù‚Ø³Ù…ØŸ")) return;
    try {
      await apiClient(`/categories/${id}`, { method: "DELETE" });
      await loadCategories();
    } catch (err: unknown) {
      alert((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary">Ø§Ù„Ø£Ù‚Ø³Ø§Ù…</h1>
        <button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className="bg-primary text-white px-4 py-2 rounded-full text-sm flex items-center gap-1"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Ø¥Ù„ØºØ§Ø¡" : "Ù‚Ø³Ù… Ø¬Ø¯ÙŠØ¯"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border border-gray-200 rounded-xl p-4 mb-6 space-y-3">
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

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              Slug (Ø±Ø§Ø¨Ø· ØµØ¯ÙŠÙ‚ - Ø¨Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© Ø¨Ø¯ÙˆÙ† Ù…Ø³Ø§ÙØ§Øª)
            </label>
            <input
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              placeholder="bags"
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            />
          </div>

          <ImageUploader currentUrl={image} onUploaded={setImage} label="ØµÙˆØ±Ø© Ø§Ù„Ù‚Ø³Ù…" />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-white px-6 py-2 rounded-full text-sm disabled:opacity-50"
          >
            {saving ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø­ÙØ¸..." : editingId ? "Ø­ÙØ¸ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„Ø§Øª" : "Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ù‚Ø³Ù…"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400">Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„...</p>
      ) : categories.length === 0 ? (
        <p className="text-gray-400">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø£Ù‚Ø³Ø§Ù… Ø¨Ø¹Ø¯</p>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-start">
              <tr>
                <th className="p-3 text-start">Ø§Ù„ØµÙˆØ±Ø©</th>
                <th className="p-3 text-start">Ø§Ù„Ø§Ø³Ù… (Ø¹Ø±Ø¨ÙŠ)</th>
                <th className="p-3 text-start">Ø§Ù„Ø§Ø³Ù… (Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠ)</th>
                <th className="p-3 text-start">Slug</th>
                <th className="p-3 text-start">Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id} className="border-t border-gray-100">
                  <td className="p-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                      {cat.image && (
                        <img src={cat.image} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                  </td>
                  <td className="p-3">{cat.name.ar}</td>
                  <td className="p-3">{cat.name.en}</td>
                  <td className="p-3 text-gray-400">{cat.slug}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(cat)} className="text-gray-400 hover:text-primary">
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat._id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


