// src/app/api/auth/me/route.ts
// GET /api/auth/me
// ÙŠØ¹ÙŠØ¯ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ØµØ§Ø­Ø¨ Ø§Ù„ØªÙˆÙƒÙ† Ø§Ù„Ù…ÙØ±Ø³Ù„ ÙÙŠ Ø§Ù„Ù‡ÙŠØ¯Ø±
// ÙŠÙØ³ØªØ®Ø¯Ù… ÙÙŠ Ø§Ù„ÙˆØ§Ø¬Ù‡Ø© Ø§Ù„Ø£Ù…Ø§Ù…ÙŠØ© Ù„Ù…Ø¹Ø±ÙØ© "Ù…Ù† Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø§Ù„Ø­Ø§Ù„ÙŠØŸ" Ø¨Ø¹Ø¯ Ø¥Ø¹Ø§Ø¯Ø© ØªØ­Ù…ÙŠÙ„ Ø§Ù„ØµÙØ­Ø©

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const currentUser = getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json(
        { status: "error", message: "ØºÙŠØ± Ù…ØµØ±Ø­ Ù„Ùƒ - ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£ÙˆÙ„Ø§Ù‹" },
        { status: 401 }
      );
    }

    await connectDB();
    // Ù†Ø³ØªØ«Ù†ÙŠ Ø­Ù‚Ù„ password Ù…Ù† Ø§Ù„Ù†ØªÙŠØ¬Ø© Ø­ØªÙ‰ Ù„Ùˆ ÙƒØ§Ù† Ù…Ø´ÙØ±Ø§Ù‹ - Ù„Ø§ Ø¯Ø§Ø¹ÙŠ Ù„Ø¥Ø±Ø³Ø§Ù„Ù‡ Ù„Ù„ÙˆØ§Ø¬Ù‡Ø© Ø§Ù„Ø£Ù…Ø§Ù…ÙŠØ© Ø£Ø¨Ø¯Ø§Ù‹
    const user = await User.findById(currentUser.userId).select("-password");

    if (!user) {
      return NextResponse.json(
        { status: "error", message: "Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯" },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: "success", user });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


