// src/components/ProductForm.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import ImageUploader from "@/components/ImageUploader";
import { X } from "lucide-react";

interface Category {
  _id: string;
  name: {
    ar: string;
    en: string;
  };
}

interface ProductFormProps {
  productId?: string;
  initialData?: any;
}

export default function ProductForm({
  productId,
  initialData,
}: ProductFormProps) {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);

  const [nameAr, setNameAr] = useState(
    initialData?.name?.ar || ""
  );

  const [nameEn, setNameEn] = useState(
    initialData?.name?.en || ""
  );

  const [descAr, setDescAr] = useState(
    initialData?.description?.ar || ""
  );

  const [descEn, setDescEn] = useState(
    initialData?.description?.en || ""
  );

  // سعر الشراء
  const [purchasePrice, setPurchasePrice] = useState(
    initialData?.purchasePrice?.toString() || ""
  );

  // سعر البيع
  const [price, setPrice] = useState(
    initialData?.price?.toString() || ""
  );

  // سعر الخصم
  const [discountPrice, setDiscountPrice] = useState(
    initialData?.discountPrice?.toString() || ""
  );

  const [categoryId, setCategoryId] = useState(
    initialData?.categoryId?._id ||
      initialData?.categoryId ||
      ""
  );

  const [stock, setStock] = useState(
    initialData?.stock?.toString() || "0"
  );

  const [colors, setColors] = useState(
    initialData?.colors?.join(", ") || ""
  );

  const [sizes, setSizes] = useState(
    initialData?.sizes?.join(", ") || ""
  );

  const [images, setImages] = useState<string[]>(
    initialData?.images || []
  );

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    apiClient("/categories")
      .then((data) => {
        setCategories(data.categories || []);
      })
      .catch((err) => {
        console.error("Failed to load categories:", err);
      });
  }, []);

  function addImage(url: string) {
    setImages((prev) => [...prev, url]);
  }

  function removeImage(index: number) {
    setImages((prev) =>
      prev.filter((_, i) => i !== index)
    );
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setSaving(true);
    setError("");

    const purchasePriceNumber = Number(purchasePrice);
    const priceNumber = Number(price);
    const discountPriceNumber = discountPrice
      ? Number(discountPrice)
      : undefined;
    const stockNumber = Number(stock);

    if (
      !Number.isFinite(purchasePriceNumber) ||
      purchasePriceNumber < 0
    ) {
      setError("يرجى إدخال سعر شراء صحيح");
      setSaving(false);
      return;
    }

    if (
      !Number.isFinite(priceNumber) ||
      priceNumber < 0
    ) {
      setError("يرجى إدخال سعر بيع صحيح");
      setSaving(false);
      return;
    }

    if (
      discountPriceNumber !== undefined &&
      (!Number.isFinite(discountPriceNumber) ||
        discountPriceNumber < 0)
    ) {
      setError("يرجى إدخال سعر خصم صحيح");
      setSaving(false);
      return;
    }

    if (
      discountPriceNumber !== undefined &&
      discountPriceNumber > priceNumber
    ) {
      setError(
        "سعر الخصم يجب أن يكون أقل من أو يساوي سعر البيع"
      );
      setSaving(false);
      return;
    }

    if (!Number.isFinite(stockNumber) || stockNumber < 0) {
      setError("يرجى إدخال كمية مخزون صحيحة");
      setSaving(false);
      return;
    }

    const payload = {
      name: {
        ar: nameAr.trim(),
        en: nameEn.trim(),
      },

      description: {
        ar: descAr.trim(),
        en: descEn.trim(),
      },

      purchasePrice: purchasePriceNumber,

      price: priceNumber,

      discountPrice:
        discountPriceNumber !== undefined
          ? discountPriceNumber
          : undefined,

      categoryId,

      stock: stockNumber,

      colors: colors
        ? colors
            .split(",")
            .map((c: string) => c.trim())
            .filter(Boolean)
        : [],

      sizes: sizes
        ? sizes
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [],

      images,
    };

    try {
      if (productId) {
        await apiClient(
          `/products/${productId}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );
      } else {
        await apiClient("/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : String(err)
      );
    } finally {
      setSaving(false);
    }
  }

  const currentSellingPrice =
    discountPrice && Number(discountPrice) > 0
      ? Number(discountPrice)
      : Number(price || 0);

  const calculatedProfit =
    currentSellingPrice -
    Number(purchasePrice || 0);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 max-w-3xl"
    >
      {/* الاسم */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            الاسم بالعربية
          </label>

          <input
            required
            value={nameAr}
            onChange={(e) =>
              setNameAr(e.target.value)
            }
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            الاسم بالإنجليزية
          </label>

          <input
            required
            value={nameEn}
            onChange={(e) =>
              setNameEn(e.target.value)
            }
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
          />
        </div>
      </div>

      {/* الوصف */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            الوصف بالعربية
          </label>

          <textarea
            required
            value={descAr}
            onChange={(e) =>
              setDescAr(e.target.value)
            }
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            الوصف بالإنجليزية
          </label>

          <textarea
            required
            value={descEn}
            onChange={(e) =>
              setDescEn(e.target.value)
            }
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
            rows={3}
          />
        </div>
      </div>

      {/* الأسعار */}
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
        <h2 className="font-semibold text-secondary mb-4">
          أسعار المنتج
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* سعر الشراء */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              سعر الشراء
            </label>

            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={purchasePrice}
              onChange={(e) =>
                setPurchasePrice(e.target.value)
              }
              placeholder="مثال: 5000"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
            />

            <p className="text-xs text-gray-500 mt-1">
              التكلفة التي دفعتها للمورد
            </p>
          </div>

          {/* سعر البيع */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              سعر البيع
            </label>

            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value)
              }
              placeholder="مثال: 8000"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
            />

            <p className="text-xs text-gray-500 mt-1">
              السعر الأساسي للعميل
            </p>
          </div>

          {/* سعر الخصم */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              سعر الخصم
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={discountPrice}
              onChange={(e) =>
                setDiscountPrice(e.target.value)
              }
              placeholder="اختياري"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
            />

            <p className="text-xs text-gray-500 mt-1">
              يترك فارغاً إذا لا يوجد خصم
            </p>
          </div>
        </div>

        {/* الربح المتوقع */}
        {purchasePrice !== "" && price !== "" && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                الربح للوحدة:
              </span>

              <span
                className={`font-bold ${
                  calculatedProfit >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {calculatedProfit.toLocaleString()} SDG
              </span>
            </div>

            {Number(purchasePrice) > 0 && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">
                  هامش الربح التقريبي:
                </span>

                <span className="text-xs font-medium text-gray-600">
                  {(
                    (calculatedProfit /
                      Number(purchasePrice)) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* المخزون */}
      <div>
        <label className="block text-sm font-medium text-secondary mb-1">
          الكمية بالمخزون
        </label>

        <input
          required
          type="number"
          min="0"
          step="1"
          value={stock}
          onChange={(e) =>
            setStock(e.target.value)
          }
          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
        />
      </div>

      {/* القسم */}
      <div>
        <label className="block text-sm font-medium text-secondary mb-1">
          القسم
        </label>

        <select
          required
          value={categoryId}
          onChange={(e) =>
            setCategoryId(e.target.value)
          }
          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
        >
          <option value="">
            -- اختر قسماً --
          </option>

          {categories.map((cat) => (
            <option
              key={cat._id}
              value={cat._id}
            >
              {cat.name.ar}
            </option>
          ))}
        </select>

        {categories.length === 0 && (
          <p className="text-xs text-yellow-600 mt-1">
            لا توجد أقسام بعد - أضف قسماً أولاً
            من صفحة الأقسام
          </p>
        )}
      </div>

      {/* الألوان والمقاسات */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            الألوان
          </label>

          <input
            value={colors}
            onChange={(e) =>
              setColors(e.target.value)
            }
            placeholder="أسود, بني, أحمر"
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
          />

          <p className="text-xs text-gray-500 mt-1">
            افصل بين الألوان بفاصلة
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            المقاسات
          </label>

          <input
            value={sizes}
            onChange={(e) =>
              setSizes(e.target.value)
            }
            placeholder="S, M, L"
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
          />

          <p className="text-xs text-gray-500 mt-1">
            افصل بين المقاسات بفاصلة
          </p>
        </div>
      </div>

      {/* الصور */}
      <div>
        <label className="block text-sm font-medium text-secondary mb-2">
          صور المنتج
        </label>

        <div className="flex flex-wrap gap-3 mb-3">
          {images.map((img, i) => (
            <div
              key={i}
              className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300"
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover"
              />

              <button
                type="button"
                onClick={() =>
                  removeImage(i)
                }
                className="absolute top-0.5 end-0.5 bg-black/60 text-white rounded-full p-0.5"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        <ImageUploader
          onUploaded={addImage}
          label="أضف صورة جديدة"
        />
      </div>

      {/* الخطأ */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* الحفظ */}
      <button
        type="submit"
        disabled={saving}
        className="bg-primary text-white px-6 py-2.5 rounded-full text-sm disabled:opacity-50"
      >
        {saving
          ? "جاري الحفظ..."
          : productId
          ? "حفظ التعديلات"
          : "إضافة المنتج"}
      </button>
    </form>
  );
}