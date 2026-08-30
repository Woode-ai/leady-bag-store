// src/models/Product.ts
// ÙŠØ¹Ø±Ù‘Ù ÙƒÙ„ Ù…Ù†ØªØ¬ ÙÙŠ Ø§Ù„Ù…ØªØ¬Ø±: Ø§Ø³Ù…Ù‡ØŒ ÙˆØµÙÙ‡ØŒ Ø³Ø¹Ø±Ù‡ØŒ ØµÙˆØ±Ù‡ØŒ ØªÙ‚ÙŠÙŠÙ…Ø§ØªÙ‡ØŒ Ø¥Ù„Ø®

import mongoose, { Schema, models, model } from "mongoose";

export interface IRating {
  userId: mongoose.Types.ObjectId;
  rating: number; // Ù…Ù† 1 Ø¥Ù„Ù‰ 5 Ù†Ø¬ÙˆÙ…
  comment?: string;
  images?: string[]; // Ø§Ù„Ø¹Ù…ÙŠÙ„ ÙŠÙ…ÙƒÙ†Ù‡ Ø¥Ø±ÙØ§Ù‚ ØµÙˆØ± Ù…Ø¹ ØªÙ‚ÙŠÙŠÙ…Ù‡
  createdAt: Date;
}

export interface IProduct {
  _id: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  price: number;
  discountPrice?: number; // Ø§Ù„Ø³Ø¹Ø± Ø¨Ø¹Ø¯ Ø§Ù„Ø®ØµÙ… (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)
  images: string[]; // Ù…ØµÙÙˆÙØ© Ø±ÙˆØ§Ø¨Ø· Ø§Ù„ØµÙˆØ± (Ù…Ù† Cloudinary)
  categoryId: mongoose.Types.ObjectId;
  stock: number; // Ø§Ù„ÙƒÙ…ÙŠØ© Ø§Ù„Ù…ØªÙˆÙØ±Ø© ÙÙŠ Ø§Ù„Ù…Ø®Ø²ÙˆÙ†
  sizes?: string[]; // Ù…Ø«Ø§Ù„: ["S", "M", "L"]
  colors?: string[]; // Ù…Ø«Ø§Ù„: ["Ø£Ø­Ù…Ø±", "Ø£Ø³ÙˆØ¯"]
  ratings: IRating[];
  createdAt: Date;
  updatedAt: Date;
}

const RatingSchema = new Schema<IRating>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    images: [{ type: String }],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      ar: { type: String, required: true, trim: true },
      en: { type: String, required: true, trim: true },
    },
    description: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
    },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    images: [{ type: String }], // ØªØ¨Ø¯Ø£ ÙØ§Ø±ØºØ©ØŒ Ø§Ù„Ø£Ø¯Ù…Ù† ÙŠØ±ÙØ¹ Ø§Ù„ØµÙˆØ± Ù„Ø§Ø­Ù‚Ø§Ù‹
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    stock: { type: Number, required: true, default: 0, min: 0 },
    sizes: [{ type: String }],
    colors: [{ type: String }],
    ratings: [RatingSchema],
  },
  { timestamps: true }
);

export default models.Product || model<IProduct>("Product", ProductSchema);

ProductSchema.index({ categoryId: 1, createdAt: -1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ stock: 1 });


