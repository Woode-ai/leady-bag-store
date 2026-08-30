// src/models/Analytics.ts
// ÙŠØ®Ø²Ù‘Ù† Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª ÙŠÙˆÙ…ÙŠØ©: Ø¹Ø¯Ø¯ Ø§Ù„Ø²ÙŠØ§Ø±Ø§Øª ÙˆØ§Ù„Ù…Ø¨ÙŠØ¹Ø§ØªØŒ ØªÙØ³ØªØ®Ø¯Ù… ÙÙŠ Ù„ÙˆØ­Ø© ØªØ­ÙƒÙ… Ø§Ù„Ø£Ø¯Ù…Ù† Ù„Ù„Ø±Ø³ÙˆÙ… Ø§Ù„Ø¨ÙŠØ§Ù†ÙŠØ©

import mongoose, { Schema, models, model } from "mongoose";

export interface IAnalytics {
  _id: string;
  date: Date;
  visits: number;
  sales: number;
  ordersCount: number;
}

const AnalyticsSchema = new Schema<IAnalytics>(
  {
    date: { type: Date, required: true, unique: true },
    visits: { type: Number, default: 0 },
    sales: { type: Number, default: 0 },
    ordersCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default models.Analytics || model<IAnalytics>("Analytics", AnalyticsSchema);

// --- 1. ØªØ¹Ø±ÙŠÙ Ù†Ù…ÙˆØ°Ø¬ ØªÙ†Ø³ÙŠÙ‚ Ø§Ù„Ø¥Ø·Ù„Ø§Ù„Ø§Øª Look Schema ---
export interface ILook {
  _id: string;
  title: { ar: string; en: string };
  slug: string;
  description: { ar: string; en: string };
  imageUrl: string;
  bundlePrice: number;
  products: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LookSchema = new Schema<ILook>(
  {
    title: {
      ar: { type: String, required: true, trim: true },
      en: { type: String, required: true, trim: true },
    },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: {
      ar: { type: String, default: "", trim: true },
      en: { type: String, default: "", trim: true },
    },
    imageUrl: { type: String, required: true },
    bundlePrice: { type: Number, required: true, min: 0 },
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Look = models.Look || model<ILook>("Look", LookSchema);

// --- 2. ØªØ¹Ø±ÙŠÙ Ù†Ù…ÙˆØ°Ø¬ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ø°ÙƒÙŠØ© Notification Schema ---
export interface INotification {
  _id: string;
  userId?: mongoose.Types.ObjectId | null; // null Ù„Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ø¹Ø§Ù…Ø© Ù„Ø¬Ù…ÙŠØ¹ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†
  title: string;
  message: string;
  type: "order_status" | "payment_update" | "new_look" | "system";
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["order_status", "payment_update", "new_look", "system"],
      default: "system",
    },
    isRead: { type: Boolean, default: false },
    link: { type: String },
  },
  { timestamps: true }
);

export const Notification = models.Notification || model<INotification>("Notification", NotificationSchema);


