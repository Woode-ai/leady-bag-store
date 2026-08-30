// src/app/admin/settings/page.tsx

"use client";

import {
  useEffect,
  useState,
} from "react";
import { apiClient } from "@/lib/apiClient";
import ImageUploader from "@/components/ImageUploader";

export default function AdminSettingsPage() {
  const [
    whatsappNumber,
    setWhatsappNumber,
  ] = useState("");

  const [
    whatsappQrImage,
    setWhatsappQrImage,
  ] = useState("");

  const [
    pointsPerCurrencySpent,
    setPointsPerCurrencySpent,
  ] = useState(1);

  const [
    currencyValuePerPoint,
    setCurrencyValuePerPoint,
  ] = useState(10);

  const [
    minPointsToRedeem,
    setMinPointsToRedeem,
  ] = useState(10);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const data =
        await apiClient("/settings");

      const settings =
        data?.settings || {};

      setWhatsappNumber(
        settings.whatsappNumber ||
          ""
      );

      setWhatsappQrImage(
        settings.whatsappQrImage ||
          ""
      );

      setPointsPerCurrencySpent(
        Number(
          settings.pointsPerCurrencySpent ??
            1
        )
      );

      setCurrencyValuePerPoint(
        Number(
          settings.currencyValuePerPoint ??
            10
        )
      );

      setMinPointsToRedeem(
        Number(
          settings.minPointsToRedeem ??
            10
        )
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : String(err)
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess(false);

    /*
     * حماية القيم قبل إرسالها.
     */

    const pointsRate = Number(
      pointsPerCurrencySpent
    );

    const pointValue = Number(
      currencyValuePerPoint
    );

    const minimumPoints = Number(
      minPointsToRedeem
    );

    if (
      !Number.isFinite(
        pointsRate
      ) ||
      pointsRate < 0
    ) {
      setError(
        "عدد النقاط لكل 100 SDG يجب أن يكون 0 أو أكثر."
      );
      setSaving(false);
      return;
    }

    if (
      !Number.isFinite(
        pointValue
      ) ||
      pointValue < 1
    ) {
      setError(
        "قيمة النقطة يجب أن تكون 1 SDG أو أكثر."
      );
      setSaving(false);
      return;
    }

    if (
      !Number.isFinite(
        minimumPoints
      ) ||
      minimumPoints < 1
    ) {
      setError(
        "الحد الأدنى للاستبدال يجب أن يكون نقطة واحدة أو أكثر."
      );
      setSaving(false);
      return;
    }

    try {
      await apiClient(
        "/settings",
        {
          method: "PUT",

          body: JSON.stringify({
            whatsappNumber,
            whatsappQrImage,

            pointsPerCurrencySpent:
              pointsRate,

            currencyValuePerPoint:
              pointValue,

            minPointsToRedeem:
              Math.floor(
                minimumPoints
              ),
          }),
        }
      );

      setSuccess(true);

      setTimeout(
        () => setSuccess(false),
        3000
      );
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

  if (loading) {
    return (
      <p className="text-gray-400">
        جاري التحميل...
      </p>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">
        إعدادات المتجر ونقاط الولاء
      </h1>

      <p className="text-xs text-gray-500 mb-6">
        إدارة إعدادات التواصل وبرنامج
        المكافآت ونقاط الهدايا لعميلات
        Leadybag
      </p>

      <form
        onSubmit={handleSave}
        className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm"
      >
        {/* =====================================================
            برنامج الولاء
            ===================================================== */}

        <div className="border-b border-gray-100 pb-6">
          <h2 className="text-base font-bold text-secondary mb-3">
            برنامج نقاط الولاء والمكافآت
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                نقاط لكل 100 SDG تنفقها
                العميلة
              </label>

              <input
                type="number"
                min={0}
                step="1"
                value={
                  pointsPerCurrencySpent
                }
                onChange={(e) =>
                  setPointsPerCurrencySpent(
                    Number(
                      e.target.value
                    )
                  )
                }
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm"
              />

              <p className="text-[10px] text-gray-400 mt-1">
                ضع 0 لتعطيل اكتساب نقاط
                الشراء.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                قيمة النقطة الواحدة
                بالجنيه SDG
              </label>

              <input
                type="number"
                min={1}
                step="1"
                value={
                  currencyValuePerPoint
                }
                onChange={(e) =>
                  setCurrencyValuePerPoint(
                    Number(
                      e.target.value
                    )
                  )
                }
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                الحد الأدنى لاستبدال
                النقاط
              </label>

              <input
                type="number"
                min={1}
                step="1"
                value={
                  minPointsToRedeem
                }
                onChange={(e) =>
                  setMinPointsToRedeem(
                    Number(
                      e.target.value
                    )
                  )
                }
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm"
              />
            </div>
          </div>

          {/* معاينة */}
          <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-xs text-amber-900">
              <strong>مثال:</strong>{" "}
              عند إنفاق 1,000 SDG، ستحصل
              العميلة على{" "}
              <strong>
                {Math.floor(
                  pointsPerCurrencySpent *
                    10
                )}{" "}
                نقطة
              </strong>{" "}
              إذا كان معدل النقاط{" "}
              {pointsPerCurrencySpent}{" "}
              نقطة لكل 100 SDG.
            </p>

            <p className="text-xs text-amber-800 mt-1">
              كل نقطة تساوي{" "}
              <strong>
                {currencyValuePerPoint}{" "}
                SDG
              </strong>
              ، والاستبدال يبدأ من{" "}
              <strong>
                {minPointsToRedeem} نقطة
              </strong>
              .
            </p>
          </div>
        </div>

        {/* =====================================================
            واتساب
            ===================================================== */}

        <div className="space-y-4">
          <h2 className="text-base font-bold text-secondary">
            إعدادات الدعم عبر واتساب
          </h2>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              رقم الواتساب الرسمي
            </label>

            <input
              value={whatsappNumber}
              onChange={(e) =>
                setWhatsappNumber(
                  e.target.value.replace(
                    /[^0-9]/g,
                    ""
                  )
                )
              }
              placeholder="249912345678"
              dir="ltr"
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-start"
            />

            <p className="text-[11px] text-gray-400 mt-1">
              بصيغة دولية بدون + أو مسافات
              (مثال: 249912345678).
            </p>
          </div>

          <ImageUploader
            currentUrl={
              whatsappQrImage
            }
            onUploaded={(url) =>
              setWhatsappQrImage(url)
            }
            label="صورة رمز QR الخاص بواتساب"
            folder="settings"
          />
        </div>

        {/* =====================================================
            الرسائل
            ===================================================== */}

        {error && (
          <p className="text-red-500 text-sm">
            {error}
          </p>
        )}

        {success && (
          <p className="text-green-600 text-sm font-semibold">
            تم حفظ جميع الإعدادات بنجاح ✓
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-white px-8 py-3 rounded-full text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/95 disabled:opacity-50 transition-all"
        >
          {saving
            ? "جاري الحفظ..."
            : "حفظ الإعدادات"}
        </button>
      </form>
    </div>
  );
}