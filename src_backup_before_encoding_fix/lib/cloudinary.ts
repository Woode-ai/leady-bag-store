// src/lib/cloudinary.ts
// Ø¥Ø¹Ø¯Ø§Ø¯ Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ø®Ø¯Ù…Ø© Cloudinary (ØªØ®Ø²ÙŠÙ† ÙˆÙ…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„ØµÙˆØ±)
// Ù†Ø³ØªØ®Ø¯Ù…Ù‡Ø§ Ø¨Ø¯Ù„Ø§Ù‹ Ù…Ù† Ø­ÙØ¸ Ø§Ù„ØµÙˆØ± Ø¹Ù„Ù‰ Ø§Ù„Ø³ÙŠØ±ÙØ± Ù…Ø¨Ø§Ø´Ø±Ø© Ù„Ø£Ù†Ù‡Ø§ Ø£Ø³Ø±Ø¹ ÙˆØªØ¯Ø¹Ù…:
// Ø§Ù„Ø¶ØºØ· Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠØŒ Ø§Ù„ØªØ­ÙˆÙŠÙ„ Ù„Ù€ WebPØŒ ÙˆØ§Ù„Ù€ CDN (ØªÙˆØµÙŠÙ„ Ø§Ù„ØµÙˆØ± Ø¨Ø³Ø±Ø¹Ø© Ù„Ø£ÙŠ Ù…ÙƒØ§Ù† ÙÙŠ Ø§Ù„Ø¹Ø§Ù„Ù…)

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Ø¯Ø§Ù„Ø© ØªØªØ­Ù‚Ù‚ Ø£Ù† Ø§Ù„Ø­Ø³Ø§Ø¨ Ù…ÙØ¹Ø¯Ù‘ ÙØ¹Ù„Ø§Ù‹ Ù‚Ø¨Ù„ Ù…Ø­Ø§ÙˆÙ„Ø© Ø§Ù„Ø±ÙØ¹
// Ø§Ù„Ø³Ø¨Ø¨: Ø£ÙƒØ«Ø± Ø³Ø¨Ø¨ Ø´Ø§Ø¦Ø¹ Ù„ÙØ´Ù„ Ø±ÙØ¹ Ø§Ù„ØµÙˆØ± Ù‡Ùˆ Ø¹Ø¯Ù… ØªØ¹Ø¨Ø¦Ø© Ù‡Ø°Ù‡ Ø§Ù„Ù…ØªØºÙŠØ±Ø§Øª Ø§Ù„Ø«Ù„Ø§Ø«Ø© ÙÙŠ .env.local
// ÙˆØ¨Ø¯ÙˆÙ† Ù‡Ø°Ø§ Ø§Ù„ØªØ­Ù‚Ù‚ØŒ ØªØ¸Ù‡Ø± Ø±Ø³Ø§Ù„Ø© Ø®Ø·Ø£ ØºØ§Ù…Ø¶Ø© Ù…Ù† Ù…ÙƒØªØ¨Ø© Cloudinary Ù†ÙØ³Ù‡Ø§ Ø¨Ø¯Ù„ Ø±Ø³Ø§Ù„Ø© ÙˆØ§Ø¶Ø­Ø© ØªØ´Ø±Ø­ Ø§Ù„Ù…Ø´ÙƒÙ„Ø©
export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export default cloudinary;



