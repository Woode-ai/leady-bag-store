// src/lib/rateLimit.ts
// ÙŠØ­Ø¯ Ù…Ù† Ø¹Ø¯Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø§Øª Ø§Ù„Ù…Ø³Ù…ÙˆØ­Ø© Ù…Ù† Ù†ÙØ³ IP Ø®Ù„Ø§Ù„ ÙØªØ±Ø© Ø²Ù…Ù†ÙŠØ© Ù…Ø¹ÙŠÙ†Ø©
// Ù†Ø³ØªØ®Ø¯Ù…Ù‡ Ø¹Ù„Ù‰ Ø±Ø§Ø¨Ø· ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù„Ù…Ù†Ø¹ Ø£ÙŠ Ø´Ø®Øµ Ù…Ù† ØªØ¬Ø±Ø¨Ø© Ø¢Ù„Ø§Ù ÙƒÙ„Ù…Ø§Øª Ø§Ù„Ù…Ø±ÙˆØ± ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ (Brute Force Attack)
//
// Ù…Ù„Ø§Ø­Ø¸Ø©: Ù‡Ø°Ø§ ØªØ®Ø²ÙŠÙ† "ÙÙŠ Ø§Ù„Ø°Ø§ÙƒØ±Ø©" (Memory) - ÙŠØ¹Ù…Ù„ Ø¬ÙŠØ¯Ø§Ù‹ Ù„Ù„ØªØ·ÙˆÙŠØ± ÙˆØ§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ Ø§Ù„ØµØºÙŠØ±Ø©/Ø§Ù„Ù…ØªÙˆØ³Ø·Ø©
// ÙÙŠ Ø§Ù„Ø¥Ù†ØªØ§Ø¬ Ø§Ù„ÙƒØ¨ÙŠØ± Ù…Ø¹ Ø¹Ø¯Ø© Ø³ÙŠØ±ÙØ±Ø§ØªØŒ ÙŠÙÙØ¶Ù‘Ù„ Ø§Ø³ØªØ®Ø¯Ø§Ù… Redis Ø¨Ø¯Ù„Ø§Ù‹ Ù…Ù† Ù‡Ø°Ø§ (Ù†ÙØ³ Ø§Ù„ÙÙƒØ±Ø©ØŒ Ù„ÙƒÙ† Ù…Ø´ØªØ±Ùƒ Ø¨ÙŠÙ† ÙƒÙ„ Ø§Ù„Ø³ÙŠØ±ÙØ±Ø§Øª)

interface AttemptRecord {
  count: number;
  firstAttempt: number;
}

const attempts = new Map<string, AttemptRecord>();

const WINDOW_MS = 15 * 60 * 1000; // Ù†Ø§ÙØ°Ø© Ø²Ù…Ù†ÙŠØ©: 15 Ø¯Ù‚ÙŠÙ‚Ø©
const MAX_ATTEMPTS = 5; // 5 Ù…Ø­Ø§ÙˆÙ„Ø§Øª ÙƒØ­Ø¯ Ø£Ù‚ØµÙ‰ Ø®Ù„Ø§Ù„ Ù‡Ø°Ù‡ Ø§Ù„ÙØªØ±Ø©

export function checkRateLimit(identifier: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = attempts.get(identifier);

  if (!record) {
    attempts.set(identifier, { count: 1, firstAttempt: now });
    return { allowed: true };
  }

  // Ø¥Ø°Ø§ Ø§Ù†ØªÙ‡Øª Ø§Ù„Ù†Ø§ÙØ°Ø© Ø§Ù„Ø²Ù…Ù†ÙŠØ©ØŒ Ù†Ø¨Ø¯Ø£ Ø¹Ø¯Ù‘Ø§Ù‹ Ø¬Ø¯ÙŠØ¯Ø§Ù‹
  if (now - record.firstAttempt > WINDOW_MS) {
    attempts.set(identifier, { count: 1, firstAttempt: now });
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((WINDOW_MS - (now - record.firstAttempt)) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  record.count += 1;
  return { allowed: true };
}

// ØªÙØ³ØªØ¯Ø¹Ù‰ Ø¨Ø¹Ø¯ Ù†Ø¬Ø§Ø­ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù„Ø¥Ø¹Ø§Ø¯Ø© ØªØµÙÙŠØ± Ø§Ù„Ø¹Ø¯Ù‘Ø§Ø¯ (Ø­ØªÙ‰ Ù„Ø§ ÙŠÙØ¹Ø§Ù‚ÙŽØ¨ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø§Ù„Ø´Ø±Ø¹ÙŠ Ù„Ø§Ø­Ù‚Ø§Ù‹)
export function resetRateLimit(identifier: string) {
  attempts.delete(identifier);
}

// ÙŠØ³ØªØ®Ø±Ø¬ Ø¹Ù†ÙˆØ§Ù† IP Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠ Ù„Ù„Ø·Ù„Ø¨ (ÙŠØ£Ø®Ø° Ø¨Ø¹ÙŠÙ† Ø§Ù„Ø§Ø¹ØªØ¨Ø§Ø± ÙˆØ¬ÙˆØ¯ proxy/CDN Ø£Ù…Ø§Ù… Ø§Ù„Ø³ÙŠØ±ÙØ±)
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}


