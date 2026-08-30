// src/models/PaymentMethod.ts
// Ø·Ø±Ù‚ Ø§Ù„Ø¯ÙØ¹ Ø§Ù„Ù…ØªØ§Ø­Ø© ÙÙŠ Ø§Ù„Ù…ØªØ¬Ø± - ÙŠØ¯ÙŠØ±Ù‡Ø§ Ø§Ù„Ø£Ø¯Ù…Ù† Ø¨Ø§Ù„ÙƒØ§Ù…Ù„ (Ø¥Ø¶Ø§ÙØ©/ØªØ¹Ø¯ÙŠÙ„/Ø­Ø°Ù/ØªÙØ¹ÙŠÙ„-ØªØ¹Ø·ÙŠÙ„) Ù…Ù† Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…
// Ø§Ù„Ù†ÙˆØ¹ "cod" Ù…Ø®ØµØµ Ù„Ù„Ø¯ÙØ¹ Ø¹Ù†Ø¯ Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù…ØŒ Ùˆ"bank_transfer" Ø£Ùˆ "other" Ù„Ø£ÙŠ Ø·Ø±ÙŠÙ‚Ø© Ø£Ø®Ø±Ù‰
// (ØªØ­ÙˆÙŠÙ„ Ø¨Ù†ÙƒÙŠØŒ Ù…Ø­ÙØ¸Ø© Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ©ØŒ Ø¥Ù„Ø®) Ù…Ø¹ Ù†Øµ ØªØ¹Ù„ÙŠÙ…Ø§Øª Ø­Ø±Ù‘Ø© ÙŠÙƒØªØ¨Ù‡ Ø§Ù„Ø£Ø¯Ù…Ù† (Ø±Ù‚Ù… Ø§Ù„Ø­Ø³Ø§Ø¨ØŒ Ø§Ø³Ù… Ø§Ù„Ø¨Ù†Ùƒ...)

import { Schema, models, model } from "mongoose";

export interface IPaymentMethod {
  _id: string;
  name: { ar: string; en: string }; // Ø§Ø³Ù… Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø¯ÙØ¹ ÙƒÙ…Ø§ ÙŠØ¸Ù‡Ø± Ù„Ù„Ø¹Ù…ÙŠÙ„ØŒ Ù…Ø«Ø§Ù„: "Ø§Ù„ØªØ­ÙˆÙŠÙ„ Ø§Ù„Ø¨Ù†ÙƒÙŠ - Ø¨Ù†Ùƒ Ø§Ù„Ø®Ø±Ø·ÙˆÙ…"
  type: "cod" | "bank_transfer" | "other";
  instructions?: { ar: string; en: string }; // ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ø­Ø³Ø§Ø¨/Ø§Ù„ØªØ¹Ù„ÙŠÙ…Ø§Øª (ÙØ§Ø±ØºØ© ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ Ù„Ø·Ø±ÙŠÙ‚Ø© cod)
  isActive: boolean; // Ù‡Ù„ ØªØ¸Ù‡Ø± Ù‡Ø°Ù‡ Ø§Ù„Ø·Ø±ÙŠÙ‚Ø© Ù„Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø­Ø§Ù„ÙŠØ§Ù‹ØŸ
  sortOrder: number; // ØªØ±ØªÙŠØ¨ Ø§Ù„Ø¸Ù‡ÙˆØ± ÙÙŠ ØµÙØ­Ø© Ø§Ù„Ø¯ÙØ¹ (Ø§Ù„Ø£ØµØºØ± ÙŠØ¸Ù‡Ø± Ø£ÙˆÙ„Ø§Ù‹)
  createdAt: Date;
  updatedAt: Date;
}

const PaymentMethodSchema = new Schema<IPaymentMethod>(
  {
    name: {
      ar: { type: String, required: true, trim: true },
      en: { type: String, required: true, trim: true },
    },
    type: { type: String, enum: ["cod", "bank_transfer", "other"], required: true },
    instructions: {
      ar: { type: String, default: "", trim: true },
      en: { type: String, default: "", trim: true },
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default models.PaymentMethod || model<IPaymentMethod>("PaymentMethod", PaymentMethodSchema);


