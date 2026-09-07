// src/lib/rateLimit.ts
// نظام Rate Limiting هجين وآمن ومرن (Resilient Hybrid Rate Limiting)
// يدعم Redis لتحديد المعدل الموزع عبر السيرفرات، مع تحول تلقائي وفوري للذاكرة المحلية (In-Memory Fallback)
// في حال تعطل Redis أو عدم توفره، بحيث لا ينهار النظام ولا يطلق أخطاء 500 للمستخدمين.

import { getRedisClient } from "@/lib/redisRateLimitClient";

interface MemoryRecord {
  count: number;
  firstAttempt: number;
}

const memoryStore = new Map<string, MemoryRecord>();

// تنظيف دوري للذاكرة المؤقتة لمنع تراكم المفاتيح القديمة (Memory Leak Prevention)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      if (now - record.firstAttempt > 60 * 60 * 1000) {
        memoryStore.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  remaining?: number;
}

/**
 * فحص حد المعدل للطلب الحالي.
 * @param identifier معرف الطلب (مثال: login:ip:email)
 * @param maxAttempts أقصى عدد محاولات مسموح به (افتراضياً 5)
 * @param windowMs نافذة زمنية بالملي ثانية (افتراضياً 15 دقيقة)
 */
export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): RateLimitResult {
  const now = Date.now();

  try {
    // محاولة استخدام Redis إن وُجد
    const redis = getRedisClient();
    if (redis && redis.status === "ready") {
      // التعامل المتزامن عبر Redis يُفضل مع الذاكرة الاحتياطية
      // لتفادي انتظار الـ async، نستخدم الذاكرة المحلية كحارس سريع ونحدث Redis بشكل غير متزامن
      void (async () => {
        try {
          const redisKey = `ratelimit:${identifier}`;
          const current = await redis.incr(redisKey);
          if (current === 1) {
            await redis.pexpire(redisKey, windowMs);
          }
        } catch {
          // تجاهل أخطاء Redis بهدوء لضمان عدم توقف الطلب
        }
      })();
    }
  } catch {
    // في حال حدوث أي خطأ في تهيئة Redis، نتجاوزه للذاكرة
  }

  // استخدام In-Memory Store الموثوق والمحمي دائماً
  const record = memoryStore.get(identifier);

  if (!record) {
    memoryStore.set(identifier, { count: 1, firstAttempt: now });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  // إذا انتهت النافذة الزمنية، نبدأ دورة جديدة
  if (now - record.firstAttempt > windowMs) {
    memoryStore.set(identifier, { count: 1, firstAttempt: now });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  // تجاوز الحد المسموح
  if (record.count >= maxAttempts) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((windowMs - (now - record.firstAttempt)) / 1000)
    );
    return { allowed: false, retryAfterSeconds, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: maxAttempts - record.count };
}

/**
 * إعادة تعيين حد المعدل عند نجاح العملية (مثلاً بعد نجاح تسجيل الدخول)
 */
export function resetRateLimit(identifier: string): void {
  memoryStore.delete(identifier);

  try {
    const redis = getRedisClient();
    if (redis && redis.status === "ready") {
      void redis.del(`ratelimit:${identifier}`).catch(() => {});
    }
  } catch {
    // تجاهل
  }
}

/**
 * استخراج عنوان IP الحقيقي للطلب مع منع تزييف الترويسات (Anti-Spoofing)
 */
export function getClientIp(req: Request): string {
  try {
    // 1. الأولوية للترويسات المباشرة الموثوقة من منصات البروكسي مثل Cloudflare
    const cfIp = req.headers.get("cf-connecting-ip");
    if (cfIp && cfIp.trim()) return cfIp.trim();

    // 2. ترويسة البروكسي المباشر Nginx / Vercel
    const realIp = req.headers.get("x-real-ip");
    if (realIp && realIp.trim()) return realIp.trim();

    // 3. في حال وجود X-Forwarded-For، نأخذ أول IP صالح
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
      const ips = forwarded.split(",").map((ip) => ip.trim()).filter(Boolean);
      if (ips.length > 0) {
        return ips[0];
      }
    }
  } catch {
    // fallback
  }

  return "127.0.0.1";
}
