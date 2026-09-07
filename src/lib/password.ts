// src/lib/password.ts
// نظام إدارة وتشفير كلمات المرور مع التوافق التام مع تشفير لاراول ($2y$ / $2x$) و bcryptjs

import bcrypt from "bcryptjs";

/**
 * لاراول ونظام PHP يستخدمان بادئة $2y$ (أو نادراً $2x$) لتشفير bcrypt.
 * مكتبة bcryptjs في بيئة Node.js تدعم معيار $2a$ و $2b$.
 * هذه الدالة تقوم بمطابقة وتعديل البادئة تلقائياً لضمان التحقق السلس
 * من كلمات المرور المنقولة من قواعد بيانات لاراول القديمة أو الأنظمة الحديثة.
 */
export function normalizeBcryptHash(hash: string): string {
  if (!hash || typeof hash !== "string") return "";
  
  const trimmed = hash.trim();
  if (trimmed.startsWith("$2y$") || trimmed.startsWith("$2x$")) {
    return "$2a$" + trimmed.slice(4);
  }
  return trimmed;
}

/**
 * مقارنة كلمة المرور المدخلة مع التجزئة المشفرة المخزنة في قاعدة البيانات
 * مع حماية من الأخطاء والتوافق مع تشفير لاراول.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  try {
    const normalized = normalizeBcryptHash(hash);
    return await bcrypt.compare(password, normalized);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

/**
 * تشفير كلمة المرور بقوة التشفير القياسية (Salt rounds = 10)
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== "string") {
    throw new Error("Invalid password provided for hashing");
  }
  return await bcrypt.hash(password, 10);
}
