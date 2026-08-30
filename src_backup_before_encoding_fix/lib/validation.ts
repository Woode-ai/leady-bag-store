import { z } from "zod";

const safeText = (max: number) => z.string().trim().max(max);

export const registerSchema = z.object({
  name: safeText(100).min(2, "Ø§Ù„Ø§Ø³Ù… ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø­Ø±ÙÙŠÙ† Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„"),
  email: z.string().email("Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ ØºÙŠØ± ØµØ­ÙŠØ­").max(254).transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8, "ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† 8 Ø£Ø­Ø±Ù Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„").max(128),
  phone: safeText(30).optional(),
  address: safeText(500).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ ØºÙŠØ± ØµØ­ÙŠØ­").max(254).transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1).max(128),
});

export const categorySchema = z.object({
  name: z.object({
    ar: safeText(100).min(1),
    en: safeText(100).min(1),
  }),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i),
  image: z.string().url().max(2048).optional(),
  parentId: z.string().nullable().optional(),
});

const productFieldsSchema = z.object({
  name: z.object({
    ar: safeText(200).min(1),
    en: safeText(200).min(1),
  }),
  description: z.object({
    ar: safeText(5000).min(1),
    en: safeText(5000).min(1),
  }),
  price: z.number().finite().nonnegative(),
  discountPrice: z.number().finite().nonnegative().optional(),
  images: z.array(z.string().url().max(2048)).max(20).optional(),
  categoryId: z.string().min(1),
  stock: z.number().int().min(0).max(1_000_000),
  sizes: z.array(safeText(30)).max(50).optional(),
  colors: z.array(safeText(50)).max(50).optional(),
});

const validateProductPrices = (value: { price?: number; discountPrice?: number }, ctx: z.RefinementCtx) => {
  if (value.discountPrice !== undefined && value.price !== undefined && value.discountPrice > value.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["discountPrice"],
      message: "Ø³Ø¹Ø± Ø§Ù„Ø®ØµÙ… Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø£Ù† ÙŠÙƒÙˆÙ† Ø£ÙƒØ¨Ø± Ù…Ù† Ø§Ù„Ø³Ø¹Ø± Ø§Ù„Ø£ØµÙ„ÙŠ",
    });
  }
};

export const productSchema = productFieldsSchema.superRefine(validateProductPrices);
export const productUpdateSchema = productFieldsSchema.partial().superRefine(validateProductPrices);

export const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: safeText(2000).optional(),
  images: z.array(z.string().url().max(2048)).max(10).optional(),
});

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(1000),
});

export const createOrderSchema = z.object({
  shippingAddress: safeText(1000).min(5),
  paymentMethodId: z.string().min(1),
  useLoyaltyPoints: z.boolean().optional().default(false),
});

export const couponSchema = z.object({
  code: z.string().trim().min(3).max(50).regex(/^[A-Za-z0-9_-]+$/),
  discountType: z.enum(["percentage", "fixed"]),
  value: z.number().finite().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  usageLimit: z.number().int().positive().max(10_000_000).optional(),
}).superRefine((value, ctx) => {
  if (value.discountType === "percentage" && value.value > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["value"],
      message: "Ù†Ø³Ø¨Ø© Ø§Ù„Ø®ØµÙ… Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø£Ù† ØªØªØ¬Ø§ÙˆØ² 100%",
    });
  }
  if (new Date(value.endDate) <= new Date(value.startDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDate"],
      message: "ØªØ§Ø±ÙŠØ® Ø§Ù„Ø§Ù†ØªÙ‡Ø§Ø¡ ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø¨Ø¹Ø¯ ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¨Ø¯Ø§ÙŠØ©",
    });
  }
});

export const paymentMethodSchema = z.object({
  name: z.object({
    ar: safeText(150).min(1),
    en: safeText(150).min(1),
  }),
  type: z.enum(["cod", "bank_transfer", "other"]),
  instructions: z.object({
    ar: safeText(2000).optional().default(""),
    en: safeText(2000).optional().default(""),
  }).optional(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(-100_000).max(100_000).optional().default(0),
});

export const settingsSchema = z.object({
  whatsappNumber: z.string()
    .regex(/^[0-9]*$/)
    .max(20)
    .optional()
    .default(""),
  whatsappQrImage: z.union([z.string().url().max(2048), z.literal("")]).optional().default(""),
});


