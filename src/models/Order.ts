// src/models/Order.ts
// يعرّف كل طلب شراء يقوم به العميل

import mongoose, { Schema, models, model } from "mongoose";

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price: number; // سعر المنتج وقت الشراء (لا يتغير حتى لو تغير سعر المنتج لاحقاً)
}

// نخزّن "لقطة" (snapshot) من طريقة الدفع وقت الشراء وليس مجرد إشارة (id) إليها فقط
// السبب: لو عدّل الأدمن اسم طريقة الدفع أو حذفها لاحقاً، يجب أن تبقى الطلبات القديمة
// تعرض الاسم الذي اختاره العميل فعلياً وقت الشراء دون أن يتأثر بأي تعديل لاحق
export interface IOrderPaymentMethod {
  methodId: mongoose.Types.ObjectId | null; // null إذا حُذفت طريقة الدفع لاحقاً من لوحة التحكم
  name: { ar: string; en: string };
  type: "cod" | "bank_transfer" | "other";
  instructions?: { ar: string; en: string };
}

export interface IOrder {
  _id: string;
  userId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  total: number;
  discount: number;
  coupon?: string; // كود الكوبون المستخدم إن وجد
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";
  shippingAddress: string;
  paymentMethod: IOrderPaymentMethod;
  paymentStatus: "pending_verification" | "verified" | "rejected" | "pending" | "paid" | "failed" | "cod";
  receiptImage?: string; // مسار صورة إشعار التحويل البنكي (بنكك/فوري)
  transactionReference?: string; // رقم المعاملة البنكية
  rejectionReason?: string; // سبب رفض إيصال الدفع إن وجد
  loyaltyPointsUsed?: number; // عدد نقاط المكافآت المستبدلة في هذا الطلب
  loyaltyDiscount?: number; // قيمة الخصم المالي المقابل لنقاط الولاء
  returnStatus?: "none" | "requested" | "approved" | "rejected"; // حالة طلب الاسترجاع
  returnReason?: string; // سبب الاسترجاع
  returnRequestedAt?: Date; // وقت تقديم طلب الاسترجاع
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const OrderPaymentMethodSchema = new Schema<IOrderPaymentMethod>(
  {
    methodId: { type: Schema.Types.ObjectId, ref: "PaymentMethod", default: null },
    name: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
    },
    type: { type: String, enum: ["cod", "bank_transfer", "other"], required: true },
    instructions: {
      ar: { type: String, default: "" },
      en: { type: String, default: "" },
    },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [OrderItemSchema],
    total: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    coupon: { type: String },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled", "returned"],
      default: "pending",
    },
    shippingAddress: { type: String, required: true },
    paymentMethod: { type: OrderPaymentMethodSchema, required: true },
    paymentStatus: {
      type: String,
      enum: ["pending_verification", "verified", "rejected", "pending", "paid", "failed", "cod"],
      default: "pending",
    },
    receiptImage: { type: String },
    transactionReference: { type: String },
    rejectionReason: { type: String },
    loyaltyPointsUsed: { type: Number, default: 0 },
    loyaltyDiscount: { type: Number, default: 0 },
    returnStatus: {
      type: String,
      enum: ["none", "requested", "approved", "rejected"],
      default: "none",
    },
    returnReason: { type: String },
    returnRequestedAt: { type: Date },
    trackingNumber: { type: String },
  },
  { timestamps: true }
);

export default models.Order || model<IOrder>("Order", OrderSchema);

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });


