// src/app/admin/payment-methods/page.tsx
// إدارة طرق الدفع: إضافة/تعديل/حذف/تفعيل-تعطيل
// هذه هي الطرق التي ستظهر فعلياً للعميل في صفحة الدفع (/checkout) - إن لم توجد أي طريقة مفعّلة
// فلن يتمكن أي عميل من إتمام الشراء، لذا يجب إضافة طريقة واحدة على الأقل (مثلاً "الدفع عند الاستلام")

"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { Plus, X, Trash2, Pencil } from "lucide-react";

interface PaymentMethod {
  _id: string;
  name: { ar: string; en: string };
  type: "cod" | "bank_transfer" | "other";
  instructions?: { ar: string; en: string };
  isActive: boolean;
  sortOrder: number;
}

const typeLabels: Record<string, string> = {
  cod: "الدفع عند الاستلام",
  bank_transfer: "تحويل بنكي",
  other: "طريقة أخرى",
};

const emptyForm = {
  nameAr: "",
  nameEn: "",
  type: "bank_transfer" as PaymentMethod["type"],
  instructionsAr: "",
  instructionsEn: "",
  sortOrder: "0",
};

export default function AdminPaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await apiClient("/payment-methods");
      setMethods(data.paymentMethods);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setError("");
  }

  function startEdit(m: PaymentMethod) {
    setForm({
      nameAr: m.name.ar,
      nameEn: m.name.en,
      type: m.type,
      instructionsAr: m.instructions?.ar || "",
      instructionsEn: m.instructions?.en || "",
      sortOrder: String(m.sortOrder ?? 0),
    });
    setEditingId(m._id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: { ar: form.nameAr, en: form.nameEn },
      type: form.type,
      instructions: { ar: form.instructionsAr, en: form.instructionsEn },
      sortOrder: Number(form.sortOrder) || 0,
    };

    try {
      if (editingId) {
        await apiClient(`/payment-methods/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient("/payment-methods", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      await load();
    } catch (err: unknown) {
      setError((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(m: PaymentMethod) {
    try {
      await apiClient(`/payment-methods/${m._id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !m.isActive }),
      });
      await load();
    } catch (err: unknown) {
      alert((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف طريقة الدفع هذه؟")) return;
    try {
      await apiClient(`/payment-methods/${id}`, { method: "DELETE" });
      await load();
    } catch (err: unknown) {
      alert((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-secondary">طرق الدفع</h1>
        <button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className="bg-primary text-white px-4 py-2 rounded-full text-sm flex items-center gap-1"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "إلغاء" : "طريقة دفع جديدة"}
        </button>
      </div>
      <p className="text-xs text-gray-400 mb-6">
        فقط الطرق "مفعّلة" تظهر للعميل عند إتمام الشراء - يجب أن تبقى طريقة واحدة على الأقل مفعّلة دائماً.
      </p>

      {showForm && (
        <form onSubmit={handleSubmit} className="border border-gray-200 rounded-xl p-4 mb-6 space-y-3 max-w-xl">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">الاسم (عربي)</label>
              <input
                required
                value={form.nameAr}
                onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                placeholder="التحويل البنكي - بنك الخرطوم"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">الاسم (إنجليزي)</label>
              <input
                required
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                placeholder="Bank Transfer - Bank of Khartoum"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">النوع</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as PaymentMethod["type"] })}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            >
              <option value="cod">الدفع عند الاستلام</option>
              <option value="bank_transfer">تحويل بنكي</option>
              <option value="other">طريقة أخرى</option>
            </select>
          </div>

          {form.type !== "cod" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  تعليمات الدفع (عربي)
                </label>
                <textarea
                  value={form.instructionsAr}
                  onChange={(e) => setForm({ ...form, instructionsAr: e.target.value })}
                  rows={3}
                  placeholder={"اسم البنك: ...\nاسم صاحب الحساب: ...\nرقم الحساب: ..."}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  تعليمات الدفع (إنجليزي)
                </label>
                <textarea
                  value={form.instructionsEn}
                  onChange={(e) => setForm({ ...form, instructionsEn: e.target.value })}
                  rows={3}
                  placeholder={"Bank name: ...\nAccount holder: ...\nAccount number: ..."}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">ترتيب الظهور</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm max-w-[120px]"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-white px-6 py-2 rounded-full text-sm disabled:opacity-50"
          >
            {saving ? "جاري الحفظ..." : editingId ? "حفظ التعديلات" : "إضافة طريقة الدفع"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400">جاري التحميل...</p>
      ) : methods.length === 0 ? (
        <p className="text-gray-400">
          لا توجد طرق دفع بعد - أضف طريقة واحدة على الأقل (مثل "الدفع عند الاستلام") حتى يتمكن العملاء من الشراء.
        </p>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="p-3 text-start">الاسم</th>
                <th className="p-3 text-start">النوع</th>
                <th className="p-3 text-start">الحالة</th>
                <th className="p-3 text-start">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {methods.map((m) => (
                <tr key={m._id} className="border-t border-gray-100">
                  <td className="p-3 font-medium">{m.name.ar}</td>
                  <td className="p-3 text-gray-500">{typeLabels[m.type]}</td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleActive(m)}
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        m.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {m.isActive ? "مفعّلة" : "معطّلة"}
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => startEdit(m)} className="text-gray-400 hover:text-primary">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(m._id)} className="text-gray-400 hover:text-red-500">
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


