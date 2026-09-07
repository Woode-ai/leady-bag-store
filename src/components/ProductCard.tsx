// src/components/ProductCard.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/Toast";
import { ShoppingBag, Star, Check } from "lucide-react";

interface ProductCardProps {
  product: {
    _id: string;
    name: { ar: string; en: string };
    price: number;
    discountPrice?: number;
    images: string[];
    stock: number;
    ratings: { rating: number }[];
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { lang, t, addToCartLocal } = useApp();
  const { showToast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const avgRating =
    product.ratings && product.ratings.length > 0
      ? (product.ratings.reduce((s, r) => s + r.rating, 0) / product.ratings.length).toFixed(1)
      : null;

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (product.stock === 0 || isAdding) return;

    setIsAdding(true);
    try {
      await addToCartLocal(product._id, 1);
      setIsAdded(true);
      showToast(
        lang === "ar"
          ? `تمت إضافة "${product.name[lang] || product.name.ar}" إلى السلة`
          : `Added "${product.name[lang] || product.name.en}" to cart`,
        "success"
      );
      setTimeout(() => setIsAdded(false), 1500);
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : String(err),
        "error"
      );
    } finally {
      setIsAdding(false);
    }
  }

  const primaryImage = product.images?.[0] || null;

  return (
    <Link
      href={`/products/${product._id}`}
      className="group flex flex-col bg-white border border-gray-100 rounded-3xl overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300"
    >
      {/* قسم الصورة مع التحميل الكسول */}
      <div className="aspect-square bg-gray-50 overflow-hidden relative">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name[lang] || "Product"}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm font-semibold tracking-wider">
            leadybag
          </div>
        )}

        {/* شارة الخصم إن وجدت */}
        {product.discountPrice && product.discountPrice < product.price && (
          <div className="absolute top-3 start-3 bg-rose-500 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md shadow-rose-500/20">
            {lang === "ar" ? "خصم خاص" : "Sale"}
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-secondary text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {product.name[lang] || product.name.ar}
          </h3>

          {avgRating && (
            <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold mt-1">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              <span>{avgRating}</span>
              <span className="text-[10px] text-gray-400">({product.ratings.length})</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
          <div>
            {product.discountPrice ? (
              <div className="flex flex-col">
                <span className="text-primary font-black text-base">{product.discountPrice} SDG</span>
                <span className="text-gray-400 text-xs line-through">{product.price} SDG</span>
              </div>
            ) : (
              <span className="text-primary font-black text-base">{product.price} SDG</span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || isAdding}
            className={`p-2.5 rounded-2xl transition-all shadow-sm ${
              isAdded
                ? "bg-emerald-600 text-white"
                : product.stock === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-primary/20"
            }`}
            title={product.stock === 0 ? t("outOfStock") : t("addToCart")}
          >
            {isAdded ? (
              <Check size={16} />
            ) : (
              <ShoppingBag size={16} />
            )}
          </button>
        </div>

        {product.stock === 0 && (
          <p className="text-[11px] text-rose-500 font-bold mt-1.5">{t("outOfStock")}</p>
        )}
      </div>
    </Link>
  );
}
