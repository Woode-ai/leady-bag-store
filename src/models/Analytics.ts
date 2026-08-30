// src/models/Analytics.ts
// يخزّن إحصائيات يومية: عدد الزيارات والمبيعات، تُستخدم في لوحة تحكم الأدمن للرسوم البيانية

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

// --- 1. تعريف نموذج تنسيق الإطلالات Look Schema ---
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

// --- 2. تعريف نموذج الإشعارات الذكية Notification Schema ---
export interface INotification {
  _id: string;
  userId?: mongoose.Types.ObjectId | null; // null للإشعارات العامة لجميع المستخدمين
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


