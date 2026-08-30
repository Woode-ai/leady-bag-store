import { z } from "zod";

const safeText = (max: number) =>
  z.string().trim().max(max);

// ============================================================
// REGISTER
// ============================================================

export const registerSchema = z.object({
  name: safeText(100).min(
    2,
    "الاسم يجب أن يكون حرفين على الأقل"
  ),

  email: z
    .string()
    .email("البريد الإلكتروني غير صحيح")
    .max(254)
    .transform((v) => v.toLowerCase().trim()),

  password: z
    .string()
    .min(
      8,
      "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
    )
    .max(128),

  phone: safeText(30).optional(),

  address: safeText(500).optional(),
});

// ============================================================
// LOGIN
// ============================================================

export const loginSchema = z.object({
  email: z
    .string()
    .email("البريد الإلكتروني غير صحيح")
    .max(254)
    .transform((v) => v.toLowerCase().trim()),

  password: z
    .string()
    .min(1)
    .max(128),
});

// ============================================================
// CATEGORY
// ============================================================

export const categorySchema = z.object({
  name: z.object({
    ar: safeText(100).min(1),
    en: safeText(100).min(1),
  }),

  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/i
    ),

  image: z
    .string()
    .url()
    .max(2048)
    .optional(),

  parentId: z
    .string()
    .nullable()
    .optional(),
});

// ============================================================
// PRODUCT
// ============================================================

const productFieldsSchema = z.object({
  name: z.object({
    ar: safeText(200).min(1),
    en: safeText(200).min(1),
  }),

  description: z.object({
    ar: safeText(5000).min(1),
    en: safeText(5000).min(1),
  }),

  // =========================================
  // سعر الشراء
  // =========================================
  purchasePrice: z
    .number()
    .finite()
    .nonnegative(),

  // =========================================
  // سعر البيع
  // =========================================
  price: z
    .number()
    .finite()
    .nonnegative(),

  // =========================================
  // سعر الخصم
  // =========================================
  discountPrice: z
    .number()
    .finite()
    .nonnegative()
    .optional(),

  images: z
    .array(
      z.string().url().max(2048)
    )
    .max(20)
    .optional(),

  categoryId: z
    .string()
    .min(1),

  stock: z
    .number()
    .int()
    .min(0)
    .max(1_000_000),

  sizes: z
    .array(safeText(30))
    .max(50)
    .optional(),

  colors: z
    .array(safeText(50))
    .max(50)
    .optional(),
});

// ============================================================
// PRODUCT PRICE VALIDATION
// ============================================================

const validateProductPrices = (
  value: {
    purchasePrice?: number;
    price?: number;
    discountPrice?: number;
  },
  ctx: z.RefinementCtx
) => {
  // سعر الخصم لا يجوز أن يكون أكبر من سعر البيع
  if (
    value.discountPrice !== undefined &&
    value.price !== undefined &&
    value.discountPrice > value.price
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["discountPrice"],
      message:
        "سعر الخصم لا يمكن أن يكون أكبر من سعر البيع",
    });
  }

  // في حالة إضافة منتج جديد:
  // سعر الشراء لا يجب أن يكون أكبر من سعر البيع
  if (
    value.purchasePrice !== undefined &&
    value.price !== undefined &&
    value.purchasePrice > value.price
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["purchasePrice"],
      message:
        "سعر الشراء لا يمكن أن يكون أكبر من سعر البيع",
    });
  }

  // إذا كان سعر الخصم موجودًا،
  // يجب أن يكون الربح بعد الخصم غير سالب
  if (
    value.purchasePrice !== undefined &&
    value.discountPrice !== undefined &&
    value.discountPrice < value.purchasePrice
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["discountPrice"],
      message:
        "سعر الخصم يجب ألا يكون أقل من سعر الشراء حتى لا تكون هناك خسارة",
    });
  }
};

export const productSchema =
  productFieldsSchema.superRefine(
    validateProductPrices
  );

// ============================================================
// PRODUCT UPDATE
// ============================================================

export const productUpdateSchema =
  productFieldsSchema
    .partial()
    .superRefine(validateProductPrices);

// ============================================================
// RATING
// ============================================================

export const ratingSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1)
    .max(5),

  comment: safeText(2000).optional(),

  images: z
    .array(
      z.string().url().max(2048)
    )
    .max(10)
    .optional(),
});

// ============================================================
// CART
// ============================================================

export const cartItemSchema = z.object({
  productId: z
    .string()
    .min(1),

  quantity: z
    .number()
    .int()
    .min(1)
    .max(1000),
});

// ============================================================
// ORDER
// ============================================================

export const createOrderSchema = z.object({
  shippingAddress: safeText(1000).min(5),

  paymentMethodId: z
    .string()
    .min(1),

  useLoyaltyPoints: z
    .boolean()
    .optional()
    .default(false),
});

// ============================================================
// COUPON
// ============================================================

export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3)
      .max(50)
      .regex(/^[A-Za-z0-9_-]+$/),

    discountType: z.enum([
      "percentage",
      "fixed",
    ]),

    value: z
      .number()
      .finite()
      .positive(),

    startDate: z
      .string()
      .datetime(),

    endDate: z
      .string()
      .datetime(),

    usageLimit: z
      .number()
      .int()
      .positive()
      .max(10_000_000)
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.discountType === "percentage" &&
      value.value > 100
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message:
          "نسبة الخصم لا يمكن أن تتجاوز 100%",
      });
    }

    if (
      new Date(value.endDate) <=
      new Date(value.startDate)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message:
          "تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية",
      });
    }
  });

// ============================================================
// PAYMENT METHOD
// ============================================================

export const paymentMethodSchema = z.object({
  name: z.object({
    ar: safeText(150).min(1),
    en: safeText(150).min(1),
  }),

  type: z.enum([
    "cod",
    "bank_transfer",
    "other",
  ]),

  instructions: z
    .object({
      ar: safeText(2000)
        .optional()
        .default(""),

      en: safeText(2000)
        .optional()
        .default(""),
    })
    .optional(),

  isActive: z
    .boolean()
    .optional()
    .default(true),

  sortOrder: z
    .number()
    .int()
    .min(-100_000)
    .max(100_000)
    .optional()
    .default(0),
});

// ============================================================
// SETTINGS
// ============================================================

export const settingsSchema = z.object({
  whatsappNumber: z
    .string()
    .regex(/^[0-9]*$/)
    .max(20)
    .optional()
    .default(""),

  whatsappQrImage: z
    .union([
      z.string().url().max(2048),
      z.literal(""),
    ])
    .optional()
    .default(""),
});