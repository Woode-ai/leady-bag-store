// src/lib/jwt.ts
// Ø£Ø¯ÙˆØ§Øª Ù„Ø¥Ù†Ø´Ø§Ø¡ ÙˆÙÙƒ ØªØ´ÙÙŠØ± "ØªÙˆÙƒÙ†" Ø§Ù„Ø¯Ø®ÙˆÙ„ (JWT)
// Ø§Ù„ØªÙˆÙƒÙ† Ù‡Ùˆ Ù†Øµ Ù…Ø´ÙØ± Ù†Ø¹Ø·ÙŠÙ‡ Ù„Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø¨Ø¹Ø¯ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ØŒ ÙˆÙŠØ³ØªØ®Ø¯Ù…Ù‡ Ù„Ø¥Ø«Ø¨Ø§Øª Ù‡ÙˆÙŠØªÙ‡ ÙÙŠ ÙƒÙ„ Ø·Ù„Ø¨ Ù„Ø§Ø­Ù‚

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

// Ø¥Ø°Ø§ Ù„Ù… ÙŠÙØ¹Ø¨ÙŽÙ‘Ø£ JWT_SECRETØŒ Ù†Ù…Ù†Ø¹ ØªØ´ØºÙŠÙ„ Ù‡Ø°Ø§ Ø§Ù„Ù…Ù„Ù Ø¨Ø¯Ù„Ø§Ù‹ Ù…Ù† Ù…Ø­Ø§ÙˆÙ„Ø© ØªÙˆÙ‚ÙŠØ¹/ØªØ­Ù‚Ù‚ Ø§Ù„ØªÙˆÙƒÙ†Ø§Øª Ø¨Ù…ÙØªØ§Ø­ ÙØ§Ø±Øº
// (undefined) - ÙˆÙ‡Ùˆ Ø³Ù„ÙˆÙƒ ØºÙŠØ± Ø¢Ù…Ù† ÙˆÙ‚Ø¯ ÙŠØ³Ø¨Ø¨ Ø£Ø®Ø·Ø§Ø¡ ØµØ§Ù…ØªØ© Ø£Ùˆ Ø«ØºØ±Ø§Øª ÙŠØµØ¹Ø¨ ØªØªØ¨Ø¹Ù‡Ø§ Ù„Ø§Ø­Ù‚Ø§Ù‹
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET is required and must be at least 32 characters.");
}

export interface TokenPayload {
  userId: string;
  role: "customer" | "admin";
}

// Ø¥Ù†Ø´Ø§Ø¡ ØªÙˆÙƒÙ† Ø¬Ø¯ÙŠØ¯ Ø¨Ø¹Ø¯ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¨Ù†Ø¬Ø§Ø­ - ØµØ§Ù„Ø­ Ù„Ù…Ø¯Ø© 7 Ø£ÙŠØ§Ù…
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d", algorithm: "HS256" });
}

// ÙÙƒ ØªØ´ÙÙŠØ± Ø§Ù„ØªÙˆÙƒÙ† ÙˆØ§Ù„ØªØ£ÙƒØ¯ Ø£Ù†Ù‡ ØµØ­ÙŠØ­ ÙˆØºÙŠØ± Ù…Ù†ØªÙ‡ÙŠ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ©
// ÙŠØ¹ÙŠØ¯ null Ø¥Ø°Ø§ ÙƒØ§Ù† Ø§Ù„ØªÙˆÙƒÙ† ØºÙŠØ± ØµØ§Ù„Ø­ (Ù…Ø²ÙˆÙ‘Ø± Ø£Ùˆ Ù…Ù†ØªÙ‡ÙŠ)
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


