// src/models/Product.ts

import mongoose, { Schema, models, model, type Model } from "mongoose";

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

    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPrice: {
      type: Number,
      min: 0,
    },

    images: [
      {
        type: String,
      },
    ],

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      index: true,
    },

    sizes: [
      {
        type: String,
        trim: true,
      },
    ],

    colors: [
      {
        type: String,
        trim: true,
      },
    ],

    ratings: [RatingSchema],
  },
  {
    timestamps: true,
  }
);

// الفهارس لتحسين الأداء والبحث الفوري
ProductSchema.index({ categoryId: 1, createdAt: -1 });
ProductSchema.index({ categoryId: 1, price: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ purchasePrice: 1 });
ProductSchema.index({ stock: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({
  "name.ar": "text",
  "name.en": "text",
  "description.ar": "text",
  "description.en": "text",
});

const Product: Model<IProduct> =
  (models.Product as Model<IProduct>) ||
  model<IProduct>("Product", ProductSchema);

export default Product;