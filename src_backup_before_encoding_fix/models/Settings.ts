// src/models/Settings.ts
// Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø¹Ø§Ù…Ø© Ù„Ù„Ù…ØªØ¬Ø± ÙŠØ¯ÙŠØ±Ù‡Ø§ Ø§Ù„Ø£Ø¯Ù…Ù† Ù…Ù† Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ… (ÙˆØ«ÙŠÙ‚Ø© ÙˆØ§Ø­Ø¯Ø© ÙÙ‚Ø· - Singleton)
// Ø­Ø§Ù„ÙŠØ§Ù‹ ØªØ­ØªÙˆÙŠ ÙÙ‚Ø· Ø¹Ù„Ù‰ Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø²Ø± Ø§Ù„ÙˆØ§ØªØ³Ø§Ø¨ Ø§Ù„Ø¹Ø§Ø¦Ù…ØŒ ÙˆÙŠÙ…ÙƒÙ† Ø§Ù„ØªÙˆØ³Ù‘Ø¹ ÙÙŠÙ‡Ø§ Ù…Ø³ØªÙ‚Ø¨Ù„Ø§Ù‹

import { Schema, models, model } from "mongoose";

export interface ISettings {
  _id: string;
  whatsappNumber?: string;
  whatsappQrImage?: string;
  pointsPerCurrencySpent?: number; // ÙƒÙ… Ù†Ù‚Ø·Ø© ÙŠÙƒØ³Ø¨ Ø§Ù„Ø¹Ù…ÙŠÙ„ Ù„ÙƒÙ„ 100 SDG
  currencyValuePerPoint?: number; // ÙƒÙ… Ø¬Ù†ÙŠÙ‡ ÙŠØ¹Ø§Ø¯Ù„Ù‡Ø§ Ø§Ù„Ù†Ù‚Ø·Ø© Ø§Ù„ÙˆØ§Ø­Ø¯Ø© Ø¹Ù†Ø¯ Ø§Ù„Ø§Ø³ØªØ¨Ø¯Ø§Ù„
  minPointsToRedeem?: number; // Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ø¯Ù†Ù‰ Ù…Ù† Ø§Ù„Ù†Ù‚Ø§Ø· Ù„Ù„Ø§Ø³ØªØ¨Ø¯Ø§Ù„
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


