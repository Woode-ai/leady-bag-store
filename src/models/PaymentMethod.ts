// src/models/PaymentMethod.ts
// طرق الدفع المتاحة في المتجر - يديرها الأدمن بالكامل (إضافة/تعديل/حذف/تفعيل-تعطيل) من لوحة التحكم
// النوع "cod" مخصص للدفع عند الاستلام، و"bank_transfer" أو "other" لأي طريقة أخرى
// (تحويل بنكي، محفظة إلكترونية، إلخ) مع نص تعليمات حرّة يكتبه الأدمن (رقم الحساب، اسم البنك...)

import { Schema, models, model } from "mongoose";

export interface IPaymentMethod {
  _id: string;
  name: { ar: string; en: string }; // اسم طريقة الدفع كما يظهر للعميل، مثال: "التحويل البنكي - بنك الخرطوم"
  type: "cod" | "bank_transfer" | "other";
  instructions?: { ar: string; en: string }; // تفاصيل الحساب/التعليمات (فارغة تلقائياً لطريقة cod)
  isActive: boolean; // هل تظهر هذه الطريقة للعملاء حالياً؟
  sortOrder: number; // ترتيب الظهور في صفحة الدفع (الأصغر يظهر أولاً)
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


