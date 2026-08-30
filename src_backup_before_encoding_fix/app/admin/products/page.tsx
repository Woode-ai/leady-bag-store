// src/app/admin/products/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient";
import { Plus, Trash2, Edit2 } from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const data = await apiClient("/products?limit=100");
      setProducts(data.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø­Ø°Ù Ù‡Ø°Ø§ Ø§Ù„Ù…Ù†ØªØ¬ØŸ")) return;
    try {
      await apiClient(`/products/${id}`, { method: "DELETE" });
      await loadProducts();
    } catch (err: unknown) {
      alert((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary">Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª</h1>
        <Link
          href="/admin/products/new"
          className="bg-primary text-white px-4 py-2 rounded-full text-sm flex items-center gap-1"
        >
          <Plus size={16} /> Ù…Ù†ØªØ¬ Ø¬Ø¯ÙŠØ¯
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-400">Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„...</p>
      ) : products.length === 0 ? (
        <p className="text-gray-400">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù†ØªØ¬Ø§Øª Ø¨Ø¹Ø¯</p>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="p-3 text-start">Ø§Ù„ØµÙˆØ±Ø©</th>
                <th className="p-3 text-start">Ø§Ù„Ø§Ø³Ù…</th>
                <th className="p-3 text-start">Ø§Ù„Ø³Ø¹Ø±</th>
                <th className="p-3 text-start">Ø§Ù„Ù…Ø®Ø²ÙˆÙ†</th>
                <th className="p-3 text-start">Ø§Ù„Ù‚Ø³Ù…</th>
                <th className="p-3 text-start">Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-t border-gray-100">
                  <td className="p-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                      {p.images?.[0] && (
                        <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                  </td>
                  <td className="p-3">{p.name.ar}</td>
                  <td className="p-3">
                    {p.discountPrice ? (
                      <>
                        <span className="text-primary font-medium">{p.discountPrice}</span>{" "}
                        <span className="text-gray-400 line-through text-xs">{p.price}</span>
                      </>
                    ) : (
                      p.price
                    )}
                  </td>
                  <td className="p-3">
                    <span className={p.stock < 5 ? "text-red-500" : ""}>{p.stock}</span>
                  </td>
                  <td className="p-3 text-gray-400">{p.categoryId?.name?.ar || "-"}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/products/${p._id}/edit`}
                        className="text-gray-400 hover:text-primary"
                      >
                        <Edit2 size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(p._id)}
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


