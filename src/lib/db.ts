// src/lib/db.ts
// هذا الملف مسؤول عن فتح اتصال واحد بقاعدة بيانات MongoDB والحفاظ عليه
// نستدعي دالة connectDB() من أي مكان نحتاج فيه للتعامل مع قاعدة البيانات

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error(
    "❌ لم يتم العثور على MONGODB_URI في ملف .env.local — تأكد من إنشائه وتعبئته"
  );
}

// نستخدم متغير عام (global) لمنع فتح اتصالات متعددة أثناء التطوير
// لأن Next.js يعيد تحميل الكود كثيراً في وضع التطوير (dev mode)
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    // يوجد اتصال جاهز مسبقاً، نستخدمه بدلاً من فتح اتصال جديد
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongooseInstance) => {
      console.log("✅ تم الاتصال بقاعدة البيانات بنجاح (Connected)");
      return mongooseInstance;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

/**
 * ⚡ Supabase Integration Bridge for Leadybag
 * مهيأ للربط المباشر مع Supabase (Storage / Realtime / Auth / PostgreSQL)
 * بمجرد توفر NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في .env.local
 */
export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const isConfigured = Boolean(url && key);

  return {
    url,
    key,
    isConfigured,
    // إمكانية رفع الملفات المباشرة إلى Supabase Storage Bucket
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET || "leadybag-assets",
  };
}


