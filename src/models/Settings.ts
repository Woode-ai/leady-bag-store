// src/models/Settings.ts
// إعدادات عامة للمتجر يديرها الأدمن من لوحة التحكم (وثيقة واحدة فقط - Singleton)
// حالياً تحتوي فقط على إعدادات زر الواتساب العائم، ويمكن التوسّع فيها مستقبلاً

import { Schema, models, model } from "mongoose";

export interface ISettings {
  _id: string;
  whatsappNumber?: string;
  whatsappQrImage?: string;
  pointsPerCurrencySpent?: number; // كم نقطة يكسب العميل لكل 100 SDG
  currencyValuePerPoint?: number; // كم جنيه يعادلها النقطة الواحدة عند الاستبدال
  minPointsToRedeem?: number; // الحد الأدنى من النقاط للاستبدال
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    whatsappNumber: { type: String, default: "", trim: true },
    whatsappQrImage: { type: String, default: "" },
    pointsPerCurrencySpent: { type: Number, default: 1 },
    currencyValuePerPoint: { type: Number, default: 10 },
    minPointsToRedeem: { type: Number, default: 10 },
  },
  { timestamps: true }
);

export default models.Settings || model<ISettings>("Settings", SettingsSchema);


