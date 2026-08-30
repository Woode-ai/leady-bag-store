// src/models/Coupon.ts
// ÙŠØ¹Ø±Ù‘Ù Ø£ÙƒÙˆØ§Ø¯ Ø§Ù„Ø®ØµÙ… Ø§Ù„ØªÙŠ ÙŠØ¯ÙŠØ±Ù‡Ø§ Ø§Ù„Ø£Ø¯Ù…Ù†

import { Schema, models, model } from "mongoose";

export interface ICoupon {
  _id: string;
  code: string; // Ù…Ø«Ø§Ù„: "RAMADAN25"
  discountType: "percentage" | "fixed"; // Ù†Ø³Ø¨Ø© Ù…Ø¦ÙˆÙŠØ© Ø£Ùˆ Ù‚ÙŠÙ…Ø© Ø«Ø§Ø¨ØªØ©
  value: number; // Ù…Ø«Ø§Ù„: 25 (ÙŠØ¹Ù†ÙŠ 25% Ø£Ùˆ 25 Ø¬Ù†ÙŠÙ‡ Ø­Ø³Ø¨ Ø§Ù„Ù†ÙˆØ¹)
  startDate: Date;
  endDate: Date;
  usageLimit: number; // Ø¹Ø¯Ø¯ Ù…Ø±Ø§Øª Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ù…Ø³Ù…ÙˆØ­ Ø¨Ù‡Ø§
  usedCount: number; // Ø¹Ø¯Ø¯ Ù…Ø±Ø§Øª Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„ÙØ¹Ù„ÙŠØ© Ø­ØªÙ‰ Ø§Ù„Ø¢Ù†
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ["percentage", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    usageLimit: { type: Number, default: 100 },
    usedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default models.Coupon || model<ICoupon>("Coupon", CouponSchema);

CouponSchema.index({ startDate: 1, endDate: 1, usedCount: 1 });


