// src/lib/jwt.ts
// أدوات لإنشاء وفك تشفير "توكن" الدخول (JWT)
// التوكن هو نص مشفر نعطيه للمستخدم بعد تسجيل الدخول، ويستخدمه لإثبات هويته في كل طلب لاحق

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

// إذا لم يُعبَّأ JWT_SECRET، نمنع تشغيل هذا الملف بدلاً من محاولة توقيع/تحقق التوكنات بمفتاح فارغ
// (undefined) - وهو سلوك غير آمن وقد يسبب أخطاء صامتة أو ثغرات يصعب تتبعها لاحقاً
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET is required and must be at least 32 characters.");
}

export interface TokenPayload {
  userId: string;
  role: "customer" | "admin";
}

// إنشاء توكن جديد بعد تسجيل الدخول بنجاح - صالح لمدة 7 أيام
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d", algorithm: "HS256" });
}

// فك تشفير التوكن والتأكد أنه صحيح وغير منتهي الصلاحية
// يعيد null إذا كان التوكن غير صالح (مزوّر أو منتهي)
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof decoded.userId !== "string" ||
      !["customer", "admin"].includes(decoded.role)
    ) {
      return null;
    }

    return {
      userId: decoded.userId,
      role: decoded.role as TokenPayload["role"],
    };
  } catch {
    return null;
  }
}


