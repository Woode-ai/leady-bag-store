// src/app/api/settings/route.ts
// GET /api/settings â†’ Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…ØªØ¬Ø± Ø§Ù„Ø¹Ø§Ù…Ø© (Ø±Ù‚Ù… ÙˆØ§ØªØ³Ø§Ø¨ + ØµÙˆØ±Ø© Ø±Ù…Ø² QR) - Ù‚Ø±Ø§Ø¡Ø© Ø¹Ø§Ù…Ø©ØŒ Ù„Ø§ ØªØ­ØªØ§Ø¬ ØªØ³Ø¬ÙŠÙ„ Ø¯Ø®ÙˆÙ„
//                      (ÙŠØ³ØªØ®Ø¯Ù…Ù‡Ø§ Ø²Ø± Ø§Ù„ÙˆØ§ØªØ³Ø§Ø¨ Ø§Ù„Ø¹Ø§Ø¦Ù… Ø§Ù„Ø°ÙŠ ÙŠØ¸Ù‡Ø± Ù„ÙƒÙ„ Ø²ÙˆØ§Ø± Ø§Ù„Ù…ÙˆÙ‚Ø¹)
// PUT /api/settings â†’ ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª (Ø£Ø¯Ù…Ù† ÙÙ‚Ø·)

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Settings from "@/models/Settings";
import { requireAdmin } from "@/lib/auth";
import { settingsSchema } from "@/lib/validation";

// ÙˆØ«ÙŠÙ‚Ø© ÙˆØ§Ø­Ø¯Ø© ÙÙ‚Ø· ÙÙŠ Ù‡Ø°Ø§ Ø§Ù„ÙƒÙˆÙ„ÙƒØ´Ù† Ø¯Ø§Ø¦Ù…Ø§Ù‹ - Ù‡Ø°Ù‡ Ø§Ù„Ø¯Ø§Ù„Ø© ØªØ¬Ù„Ø¨Ù‡Ø§ Ø£Ùˆ ØªÙÙ†Ø´Ø¦Ù‡Ø§ Ø¥Ù† Ù„Ù… ØªÙƒÙ† Ù…ÙˆØ¬ÙˆØ¯Ø© Ø¨Ø¹Ø¯
async function getOrCreateSettings() {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
}

export async function GET() {
  try {
    await connectDB();
    const settings = await getOrCreateSettings();

    // Ù†ÙØ¹ÙŠØ¯ ÙÙ‚Ø· Ø§Ù„Ø­Ù‚ÙˆÙ„ Ø§Ù„Ø¢Ù…Ù†Ø© Ù„Ù„Ø¹Ø±Ø¶ Ø§Ù„Ø¹Ø§Ù… (Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø­Ø§Ù„ÙŠØ§Ù‹ Ø£ÙŠ Ø­Ù‚Ù„ Ø­Ø³Ø§Ø³ Ù‡Ù†Ø§ØŒ Ù„ÙƒÙ† Ù†ÙØ¨Ù‚ÙŠ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© ØµØ±ÙŠØ­Ø©
    // Ø¨Ø¯Ù„ Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„ÙˆØ«ÙŠÙ‚Ø© ÙƒØ§Ù…Ù„Ø©ØŒ ØªØ­Ø³Ø¨Ø§Ù‹ Ù„Ø£ÙŠ Ø­Ù‚Ù„ Ø¥Ø¯Ø§Ø±ÙŠ Ø­Ø³Ø§Ø³ ÙŠÙØ¶Ø§Ù Ù…Ø³ØªÙ‚Ø¨Ù„Ø§Ù‹ Ù„Ù†ÙØ³ Ø§Ù„Ù†Ù…ÙˆØ°Ø¬)
    return NextResponse.json({
      status: "success",
      settings: {
        whatsappNumber: settings.whatsappNumber || "",
        whatsappQrImage: settings.whatsappQrImage || "",
        pointsPerCurrencySpent: settings.pointsPerCurrencySpent || 1,
        currencyValuePerPoint: settings.currencyValuePerPoint || 10,
        minPointsToRedeem: settings.minPointsToRedeem || 10,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { status: "error", message: "ØºÙŠØ± Ù…ØµØ±Ø­ Ù„Ùƒ - Ù‡Ø°Ø§ Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡ Ù„Ù„Ø£Ø¯Ù…Ù† ÙÙ‚Ø·" },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await req.json();

    const parsed = settingsSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { status: "error", message: "Ø¨ÙŠØ§Ù†Ø§Øª ØºÙŠØ± ØµØ­ÙŠØ­Ø©", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const settings = await getOrCreateSettings();
    Object.assign(settings, parsed.data);
    await settings.save();

    return NextResponse.json({ status: "success", message: "ØªÙ… Ø­ÙØ¸ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø¨Ù†Ø¬Ø§Ø­", settings });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


