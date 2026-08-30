import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { status: "error", message: "ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„" },
        { status: 401 }
      );
    }

    await connectDB();
    await Notification.updateMany(
      { userId: user.userId, isRead: false },
      { $set: { isRead: true } }
    );

    return NextResponse.json({
      status: "success",
      message: "ØªÙ… ÙˆØ¶Ø¹ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª ÙƒÙ…Ù‚Ø±ÙˆØ¡Ø©",
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±" },
      { status: 500 }
    );
  }
}


