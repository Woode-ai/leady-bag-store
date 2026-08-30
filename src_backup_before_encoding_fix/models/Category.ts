// src/models/Category.ts
// ÙŠØ¹Ø±Ù‘Ù Ø£Ù‚Ø³Ø§Ù… Ø§Ù„Ù…ØªØ¬Ø± Ù…Ø«Ù„: Ø£Ø²ÙŠØ§Ø¡ØŒ Ø¥ÙƒØ³Ø³ÙˆØ§Ø±Ø§ØªØŒ Ù…Ø³ØªØ­Ø¶Ø±Ø§Øª ØªØ¬Ù…ÙŠÙ„ØŒ Ø£Ø­Ø°ÙŠØ©ØŒ Ø­Ù‚Ø§Ø¦Ø¨
// ÙŠØ¯Ø¹Ù… Ø§Ù„Ù„ØºØªÙŠÙ† Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© ÙˆØ§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© Ù„ÙƒÙ„ Ù‚Ø³Ù…

import mongoose, { Schema, models, model } from "mongoose";

export interface ICategory {
  _id: string;
  name: {
    ar: string;
    en: string;
  };
  slug: string;
  image?: string;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
    },
    slug: { type: String, required: true, unique: true },
    image: { type: String },
  },
  { timestamps: true }
);

export default models.Category || model<ICategory>("Category", CategorySchema);


