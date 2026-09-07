// src/lib/redisRateLimitClient.ts
import Redis from "ioredis";

let client: Redis | null = null;
let available = true;

export function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!available) return null;
  if (!client) {
    client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    client.on("error", () => {
      available = false;
    });
  }
  return client;
}