// src/lib/redis.ts
// Ù†Ø¸Ø§Ù… ØªØ®Ø²ÙŠÙ† Ù…Ø¤Ù‚Øª (Caching) Ø¨Ø§Ø³ØªØ®Ø¯Ø§Ù… Redis
// Ø§Ù„ÙÙƒØ±Ø©: Ø¨Ø¹Ø¶ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª (Ù…Ø«Ù„ Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª ÙˆØ§Ù„Ø£Ù‚Ø³Ø§Ù…) ØªÙÙ‚Ø±Ø£ Ø¢Ù„Ø§Ù Ø§Ù„Ù…Ø±Ø§Øª Ù„ÙƒÙ„ Ù…Ø±Ø© ØªØªØºÙŠÙ‘Ø± ÙÙŠÙ‡Ø§
// Ø¨Ø¯Ù„ Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù€ MongoDB ÙÙŠ ÙƒÙ„ Ø·Ù„Ø¨ØŒ Ù†Ø®Ø²Ù‘Ù† Ø§Ù„Ù†ØªÙŠØ¬Ø© ÙÙŠ Redis Ù„ÙØªØ±Ø© Ù‚ØµÙŠØ±Ø© (TTL) ÙˆÙ†Ø¹ÙŠØ¯Ù‡Ø§ Ù…Ù† Ù‡Ù†Ø§Ùƒ Ù…Ø¨Ø§Ø´Ø±Ø©
// Ù‡Ø°Ø§ ÙŠÙ‚Ù„Ù„ Ø§Ù„Ø¶ØºØ· Ø¹Ù„Ù‰ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª ÙˆÙŠØ¬Ø¹Ù„ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø£Ø³Ø±Ø¹ Ø¨Ø´ÙƒÙ„ Ù…Ù„Ø­ÙˆØ¸
//
// ØªØµÙ…ÙŠÙ… "Ø§Ù„Ø¥ØµØ¯Ø§Ø±" (Version) Ø¨Ø¯Ù„Ø§Ù‹ Ù…Ù† Ø­Ø°Ù Ù…ÙØ§ØªÙŠØ­ Ù…Ø­Ø¯Ø¯Ø©:
// ÙƒÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ù†ØªØ¬Ø§Øª Ù…Ø«Ù„Ø§Ù‹ ØªÙØ®Ø²ÙŽÙ‘Ù† Ø¨Ù…ÙØªØ§Ø­ ÙÙŠÙ‡ Ø±Ù‚Ù… Ø¥ØµØ¯Ø§Ø±: products:v3:...
// Ø¹Ù†Ø¯ Ø£ÙŠ ØªØ¹Ø¯ÙŠÙ„/Ø¥Ø¶Ø§ÙØ©/Ø­Ø°Ù Ù…Ù†ØªØ¬ØŒ Ù†Ø²ÙŠØ¯ Ø§Ù„Ø¥ØµØ¯Ø§Ø± Ø¥Ù„Ù‰ v4 - ÙØªØµØ¨Ø­ ÙƒÙ„ Ø§Ù„Ù…ÙØ§ØªÙŠØ­ Ø§Ù„Ù‚Ø¯ÙŠÙ…Ø© "Ù…Ù†Ø³ÙŠØ©" ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹
// (ØªÙ†ØªÙ‡ÙŠ ØµÙ„Ø§Ø­ÙŠØªÙ‡Ø§ Ø¨Ù…Ø±ÙˆØ± Ø§Ù„ÙˆÙ‚Øª TTL Ø¯ÙˆÙ† Ø£Ù† Ù†Ø­ØªØ§Ø¬ Ù„Ù„Ø¨Ø­Ø« Ø¹Ù†Ù‡Ø§ ÙˆØ­Ø°ÙÙ‡Ø§ ÙˆØ§Ø­Ø¯Ø© ÙˆØ§Ø­Ø¯Ø©)

import Redis from "ioredis";

let redisClient: Redis | null = null;
let redisAvailable = true; // Ø¥Ø°Ø§ ÙØ´Ù„ Ø§Ù„Ø§ØªØµØ§Ù„ØŒ Ù†ÙˆÙ‚Ù Ù…Ø­Ø§ÙˆÙ„Ø© Ø§Ø³ØªØ®Ø¯Ø§Ù… Redis Ù„Ø¨Ù‚ÙŠØ© Ø§Ù„Ø·Ù„Ø¨ Ø¨Ø¯Ù„ ØªÙƒØ±Ø§Ø± Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© ÙˆØ§Ù„ÙØ´Ù„

function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) return null; // Redis ØºÙŠØ± Ù…ÙØ¹Ø¯Ù‘ - Ù†Ø¹Ù…Ù„ Ø¨Ø¯ÙˆÙ†Ù‡ Ø¨Ù„Ø§ Ù…Ø´Ø§ÙƒÙ„ (fallback Ù„Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ø¨Ø§Ø´Ø±Ø©)

  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1, // Ù„Ø§ Ù†Ø±ÙŠØ¯ Ø£Ù† ÙŠÙ†ØªØ¸Ø± Ø§Ù„Ø·Ù„Ø¨ Ø·ÙˆÙŠÙ„Ø§Ù‹ Ø¥Ø°Ø§ ÙƒØ§Ù† Redis Ù…ØªØ¹Ø·Ù„Ø§Ù‹
      lazyConnect: true,
    });
    redisClient.on("error", () => {
      redisAvailable = false; // Ø£ÙŠ Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø§ØªØµØ§Ù„ ÙŠÙˆÙ‚Ù Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„ÙƒØ§Ø´ Ù…Ø¤Ù‚ØªØ§Ù‹ØŒ Ù„ÙƒÙ† Ø§Ù„Ù…ÙˆÙ‚Ø¹ ÙŠØ³ØªÙ…Ø± Ø¨Ø§Ù„Ø¹Ù…Ù„ Ø¹Ø¨Ø± Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ø¨Ø§Ø´Ø±Ø©
    });
  }
  return redisClient;
}

// ÙŠØ¬Ù„Ø¨ Ù‚ÙŠÙ…Ø© Ù…Ù† Ø§Ù„ÙƒØ§Ø´ØŒ Ø£Ùˆ null Ø¥Ø°Ø§ Ù„Ù… ØªÙƒÙ† Ù…ÙˆØ¬ÙˆØ¯Ø© Ø£Ùˆ ÙƒØ§Ù† Redis ØºÙŠØ± Ù…ØªØ§Ø­
export async function getCached<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client || !redisAvailable) return null;

  try {
    const value = await client.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    redisAvailable = false;
    return null;
  }
}

// ÙŠØ®Ø²Ù‘Ù† Ù‚ÙŠÙ…Ø© ÙÙŠ Ø§Ù„ÙƒØ§Ø´ Ù„Ù…Ø¯Ø© ttlSeconds (Ø¨Ø¹Ø¯Ù‡Ø§ ØªÙØ­Ø°Ù ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ Ù…Ù† Redis)
export async function setCached(key: string, value: any, ttlSeconds: number): Promise<void> {
  const client = getRedisClient();
  if (!client || !redisAvailable) return;

  try {
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    redisAvailable = false;
  }
}

// ÙŠØ¬Ù„Ø¨ "Ø±Ù‚Ù… Ø¥ØµØ¯Ø§Ø±" Ø§Ù„ÙƒØ§Ø´ Ø§Ù„Ø­Ø§Ù„ÙŠ Ù„Ù†ÙˆØ¹ Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ø¹ÙŠÙ‘Ù† (Ù…Ø«Ù„Ø§Ù‹ "products" Ø£Ùˆ "categories")
export async function getCacheVersion(namespace: string): Promise<number> {
  const client = getRedisClient();
  if (!client || !redisAvailable) return 0; // 0 ÙŠØ¹Ù†ÙŠ "Ø¨Ø¯ÙˆÙ† ÙƒØ§Ø´" - Ø³ÙŠÙØ¨Ù†Ù‰ Ø§Ù„Ù…ÙØªØ§Ø­ Ù„ÙƒÙ†Ù‡ Ù„Ù† ÙŠÙØ³ØªØ®Ø¯Ù… ÙØ¹Ù„ÙŠØ§Ù‹ Ø¨Ø¯ÙˆÙ† Redis

  try {
    const version = await client.get(`cache_version:${namespace}`);
    return version ? parseInt(version) : 1;
  } catch {
    redisAvailable = false;
    return 0;
  }
}

// ÙŠÙØ³ØªØ¯Ø¹Ù‰ Ø¨Ø¹Ø¯ Ø£ÙŠ Ø¥Ø¶Ø§ÙØ©/ØªØ¹Ø¯ÙŠÙ„/Ø­Ø°Ù - ÙŠØ²ÙŠØ¯ Ø±Ù‚Ù… Ø§Ù„Ø¥ØµØ¯Ø§Ø± ÙÙŠØµØ¨Ø­ ÙƒÙ„ Ø§Ù„ÙƒØ§Ø´ Ø§Ù„Ù‚Ø¯ÙŠÙ… Ù„Ù‡Ø°Ø§ Ø§Ù„Ù†ÙˆØ¹ "Ù…Ù†ØªÙ‡ÙŠ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ©" ÙØ¹Ù„ÙŠØ§Ù‹
export async function bumpCacheVersion(namespace: string): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.incr(`cache_version:${namespace}`);
  } catch {
    redisAvailable = false;
  }
}


