// src/app/api/auth/2fa/disable/route.ts
// POST /api/auth/2fa/disable
// ÙŠØ¹Ø·Ù‘Ù„ 2FA - Ù†Ø·Ù„Ø¨ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø­Ø§Ù„ÙŠØ© Ù„Ù„ØªØ£ÙƒÙŠØ¯ (Ø­ØªÙ‰ Ù„Ø§ ÙŠØ³ØªØ·ÙŠØ¹ Ø£ÙŠ Ø´Ø®Øµ ÙˆØµÙ„ Ù„Ù„Ø¬Ù‡Ø§Ø² Ù…ÙØªÙˆØ­Ø§Ù‹ ØªØ¹Ø·ÙŠÙ„Ù‡Ø§ Ø¨Ø³Ù‡ÙˆÙ„Ø©)

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { status: "error", message: "ØºÙŠØ± Ù…ØµØ±Ø­ Ù„Ùƒ" },
        { status: 403 }
      );
    }

    await connectDB();
    const { password } = await req.json();

    const user = await User.findById(admin.userId);
    if (!user) {
      return NextResponse.json({ status: "error", message: "Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯" }, { status: 404 });
    }

    const isPasswordCorrect = await bcrypt.compare(password || "", user.password);
    if (!isPasswordCorrect) {
      return NextResponse.json(
        { status: "error", message: "ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ØºÙŠØ± ØµØ­ÙŠØ­Ø©" },
        { status: 401 }
      );
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    return NextResponse.json({ status: "success", message: "ØªÙ… ØªØ¹Ø·ÙŠÙ„ Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø© Ø§Ù„Ø«Ù†Ø§Ø¦ÙŠØ©" });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


