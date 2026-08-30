// src/models/Product.ts

import mongoose, { Schema, models, model } from "mongoose";

export interface IRating {
  userId: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  images?: string[];
  createdAt: Date;
}

export interface IProduct {
  _id: string;

  name: {
    ar: string;
    en: string;
  };

  description: {
    ar: string;
    en: string;
  };

  // سعر الشراء من المورد - يظهر للإدارة فقط
  purchasePrice: number;

  // سعر البيع الأساسي للعميل
  price: number;

  // سعر البيع بعد الخصم - اختياري
  discountPrice?: number;

  images: string[];

  categoryId: mongoose.Types.ObjectId;

  stock: number;

  sizes?: string[];

  colors?: string[];

  ratings: IRating[];

  createdAt: Date;

  updatedAt: Date;
}

const RatingSchema = new Schema<IRating>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      default: "",
      trim: true,
    },

    images: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      ar: {
        type: String,
        required: true,
        trim: true,
      },

      en: {
        type: String,
        required: true,
        trim: true,
      },
    },

    description: {
      ar: {
        type: String,
        required: true,
        trim: true,
      },

      en: {
        type: String,
        required: true,
        trim: true,
      },
    },

    // =========================================
    // سعر الشراء
    // =========================================
    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    // =========================================
    // سعر البيع
    // =========================================
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // =========================================
    // سعر الخصم
    // =========================================
    discountPrice: {
      type: Number,
      min: 0,
    },

    // =========================================
    // الصور
    // =========================================
    images: [
      {
        type: String,
      },
    ],

    // =========================================
    // القسم
    // =========================================
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    // =========================================
    // المخزون
    // =========================================
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // =========================================
    // المقاسات
    // =========================================
    sizes: [
      {
        type: String,
        trim: true,
      },
    ],

    // =========================================
    // الألوان
    // =========================================
    colors: [
      {
        type: String,
        trim: true,
      },
    ],

    // =========================================
    // التقييمات
    // =========================================
    ratings: [RatingSchema],
  },
  {
    timestamps: true,
  }
);

// =========================================
// Indexes
// =========================================

ProductSchema.index({
  categoryId: 1,
  createdAt: -1,
});

ProductSchema.index({
  price: 1,
});

ProductSchema.index({
  purchasePrice: 1,
});

ProductSchema.index({
  stock: 1,
});

export default models.Product ||
  model<IProduct>("Product", ProductSchema);