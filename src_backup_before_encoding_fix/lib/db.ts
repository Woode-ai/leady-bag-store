// src/lib/db.ts
// Ù‡Ø°Ø§ Ø§Ù„Ù…Ù„Ù Ù…Ø³Ø¤ÙˆÙ„ Ø¹Ù† ÙØªØ­ Ø§ØªØµØ§Ù„ ÙˆØ§Ø­Ø¯ Ø¨Ù‚Ø§Ø¹Ø¯Ø© Ø¨ÙŠØ§Ù†Ø§Øª MongoDB ÙˆØ§Ù„Ø­ÙØ§Ø¸ Ø¹Ù„ÙŠÙ‡
// Ù†Ø³ØªØ¯Ø¹ÙŠ Ø¯Ø§Ù„Ø© connectDB() Ù…Ù† Ø£ÙŠ Ù…ÙƒØ§Ù† Ù†Ø­ØªØ§Ø¬ ÙÙŠÙ‡ Ù„Ù„ØªØ¹Ø§Ù…Ù„ Ù…Ø¹ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error(
    "âŒ Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ MONGODB_URI ÙÙŠ Ù…Ù„Ù .env.local â€” ØªØ£ÙƒØ¯ Ù…Ù† Ø¥Ù†Ø´Ø§Ø¦Ù‡ ÙˆØªØ¹Ø¨Ø¦ØªÙ‡"
  );
}

// Ù†Ø³ØªØ®Ø¯Ù… Ù…ØªØºÙŠØ± Ø¹Ø§Ù… (global) Ù„Ù…Ù†Ø¹ ÙØªØ­ Ø§ØªØµØ§Ù„Ø§Øª Ù…ØªØ¹Ø¯Ø¯Ø© Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„ØªØ·ÙˆÙŠØ±
// Ù„Ø£Ù† Next.js ÙŠØ¹ÙŠØ¯ ØªØ­Ù…ÙŠÙ„ Ø§Ù„ÙƒÙˆØ¯ ÙƒØ«ÙŠØ±Ø§Ù‹ ÙÙŠ ÙˆØ¶Ø¹ Ø§Ù„ØªØ·ÙˆÙŠØ± (dev mode)
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    // ÙŠÙˆØ¬Ø¯ Ø§ØªØµØ§Ù„ Ø¬Ø§Ù‡Ø² Ù…Ø³Ø¨Ù‚Ø§Ù‹ØŒ Ù†Ø³ØªØ®Ø¯Ù…Ù‡ Ø¨Ø¯Ù„Ø§Ù‹ Ù…Ù† ÙØªØ­ Ø§ØªØµØ§Ù„ Ø¬Ø¯ÙŠØ¯
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongooseInstance) => {
      console.log("âœ… ØªÙ… Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø¨Ù†Ø¬Ø§Ø­ (Connected)");
      return mongooseInstance;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

/**
 * âš¡ Supabase Integration Bridge for Leadybag
 * Ù…Ù‡ÙŠØ£ Ù„Ù„Ø±Ø¨Ø· Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ù…Ø¹ Supabase (Storage / Realtime / Auth / PostgreSQL)
 * Ø¨Ù…Ø¬Ø±Ø¯ ØªÙˆÙØ± NEXT_PUBLIC_SUPABASE_URL Ùˆ SUPABASE_SERVICE_ROLE_KEY ÙÙŠ .env.local
 */
export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const isConfigured = Boolean(url && key);

  return {
    url,
    key,
    isConfigured,
    // Ø¥Ù…ÙƒØ§Ù†ÙŠØ© Ø±ÙØ¹ Ø§Ù„Ù…Ù„ÙØ§Øª Ø§Ù„Ù…Ø¨Ø§Ø´Ø±Ø© Ø¥Ù„Ù‰ Supabase Storage Bucket
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET || "leadybag-assets",
  };
}


