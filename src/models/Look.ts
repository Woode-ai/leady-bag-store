// src/models/Look.ts
import mongoose, { Schema, models, model } from "mongoose";

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

export default models.Look || model<ILook>("Look", LookSchema);


