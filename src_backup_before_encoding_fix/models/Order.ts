// src/models/Order.ts
// ÙŠØ¹Ø±Ù‘Ù ÙƒÙ„ Ø·Ù„Ø¨ Ø´Ø±Ø§Ø¡ ÙŠÙ‚ÙˆÙ… Ø¨Ù‡ Ø§Ù„Ø¹Ù…ÙŠÙ„

import mongoose, { Schema, models, model } from "mongoose";

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price: number; // Ø³Ø¹Ø± Ø§Ù„Ù…Ù†ØªØ¬ ÙˆÙ‚Øª Ø§Ù„Ø´Ø±Ø§Ø¡ (Ù„Ø§ ÙŠØªØºÙŠØ± Ø­ØªÙ‰ Ù„Ùˆ ØªØºÙŠØ± Ø³Ø¹Ø± Ø§Ù„Ù…Ù†ØªØ¬ Ù„Ø§Ø­Ù‚Ø§Ù‹)
}

// Ù†Ø®Ø²Ù‘Ù† "Ù„Ù‚Ø·Ø©" (snapshot) Ù…Ù† Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø¯ÙØ¹ ÙˆÙ‚Øª Ø§Ù„Ø´Ø±Ø§Ø¡ ÙˆÙ„ÙŠØ³ Ù…Ø¬Ø±Ø¯ Ø¥Ø´Ø§Ø±Ø© (id) Ø¥Ù„ÙŠÙ‡Ø§ ÙÙ‚Ø·
// Ø§Ù„Ø³Ø¨Ø¨: Ù„Ùˆ Ø¹Ø¯Ù‘Ù„ Ø§Ù„Ø£Ø¯Ù…Ù† Ø§Ø³Ù… Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø¯ÙØ¹ Ø£Ùˆ Ø­Ø°ÙÙ‡Ø§ Ù„Ø§Ø­Ù‚Ø§Ù‹ØŒ ÙŠØ¬Ø¨ Ø£Ù† ØªØ¨Ù‚Ù‰ Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù‚Ø¯ÙŠÙ…Ø©
// ØªØ¹Ø±Ø¶ Ø§Ù„Ø§Ø³Ù… Ø§Ù„Ø°ÙŠ Ø§Ø®ØªØ§Ø±Ù‡ Ø§Ù„Ø¹Ù…ÙŠÙ„ ÙØ¹Ù„ÙŠØ§Ù‹ ÙˆÙ‚Øª Ø§Ù„Ø´Ø±Ø§Ø¡ Ø¯ÙˆÙ† Ø£Ù† ÙŠØªØ£Ø«Ø± Ø¨Ø£ÙŠ ØªØ¹Ø¯ÙŠÙ„ Ù„Ø§Ø­Ù‚
export interface IOrderPaymentMethod {
  methodId: mongoose.Types.ObjectId | null; // null Ø¥Ø°Ø§ Ø­ÙØ°ÙØª Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø¯ÙØ¹ Ù„Ø§Ø­Ù‚Ø§Ù‹ Ù…Ù† Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…
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
  coupon?: string; // ÙƒÙˆØ¯ Ø§Ù„ÙƒÙˆØ¨ÙˆÙ† Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø¥Ù† ÙˆØ¬Ø¯
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";
  shippingAddress: string;
  paymentMethod: IOrderPaymentMethod;
  paymentStatus: "pending_verification" | "verified" | "rejected" | "pending" | "paid" | "failed" | "cod";
  receiptImage?: string; // Ù…Ø³Ø§Ø± ØµÙˆØ±Ø© Ø¥Ø´Ø¹Ø§Ø± Ø§Ù„ØªØ­ÙˆÙŠÙ„ Ø§Ù„Ø¨Ù†ÙƒÙŠ (Ø¨Ù†ÙƒÙƒ/ÙÙˆØ±ÙŠ)
  transactionReference?: string; // Ø±Ù‚Ù… Ø§Ù„Ù…Ø¹Ø§Ù…Ù„Ø© Ø§Ù„Ø¨Ù†ÙƒÙŠØ©
  rejectionReason?: string; // Ø³Ø¨Ø¨ Ø±ÙØ¶ Ø¥ÙŠØµØ§Ù„ Ø§Ù„Ø¯ÙØ¹ Ø¥Ù† ÙˆØ¬Ø¯
  loyaltyPointsUsed?: number; // Ø¹Ø¯Ø¯ Ù†Ù‚Ø§Ø· Ø§Ù„Ù…ÙƒØ§ÙØ¢Øª Ø§Ù„Ù…Ø³ØªØ¨Ø¯Ù„Ø© ÙÙŠ Ù‡Ø°Ø§ Ø§Ù„Ø·Ù„Ø¨
  loyaltyDiscount?: number; // Ù‚ÙŠÙ…Ø© Ø§Ù„Ø®ØµÙ… Ø§Ù„Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…Ù‚Ø§Ø¨Ù„ Ù„Ù†Ù‚Ø§Ø· Ø§Ù„ÙˆÙ„Ø§Ø¡
  returnStatus?: "none" | "requested" | "approved" | "rejected"; // Ø­Ø§Ù„Ø© Ø·Ù„Ø¨ Ø§Ù„Ø§Ø³ØªØ±Ø¬Ø§Ø¹
  returnReason?: string; // Ø³Ø¨Ø¨ Ø§Ù„Ø§Ø³ØªØ±Ø¬Ø§Ø¹
  returnRequestedAt?: Date; // ÙˆÙ‚Øª ØªÙ‚Ø¯ÙŠÙ… Ø·Ù„Ø¨ Ø§Ù„Ø§Ø³ØªØ±Ø¬Ø§Ø¹
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


