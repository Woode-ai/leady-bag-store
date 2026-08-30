// src/models/Category.ts
// يعرّف أقسام المتجر مثل: أزياء، إكسسوارات، مستحضرات تجميل، أحذية، حقائب
// يدعم اللغتين العربية والإنجليزية لكل قسم

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


