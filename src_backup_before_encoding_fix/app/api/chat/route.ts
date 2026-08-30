// src/app/api/chat/route.ts
// GET /api/chat
// ÙŠØ¹ÙŠØ¯ Ù‚Ø§Ø¦Ù…Ø© Ø¨ÙƒÙ„ "Ø§Ù„ØºØ±Ù" (Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø§Øª) Ø§Ù„ØªÙŠ ÙÙŠÙ‡Ø§ Ø±Ø³Ø§Ø¦Ù„ØŒ Ù…Ø¹ Ø¢Ø®Ø± Ø±Ø³Ø§Ù„Ø© ÙÙŠ ÙƒÙ„ ÙˆØ§Ø­Ø¯Ø©
// Ø£Ø¯Ù…Ù† ÙÙ‚Ø· - ÙŠÙØ³ØªØ®Ø¯Ù… ÙÙŠ ØµÙØ­Ø© /admin/chats Ù„Ø¹Ø±Ø¶ Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ø°ÙŠÙ† Ø±Ø§Ø³Ù„ÙˆØ§ Ø§Ù„Ø¯Ø¹Ù…

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ChatMessage from "@/models/ChatMessage";
import User from "@/models/User";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { status: "error", message: "ØºÙŠØ± Ù…ØµØ±Ø­ Ù„Ùƒ - Ù‡Ø°Ø§ Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡ Ù„Ù„Ø£Ø¯Ù…Ù† ÙÙ‚Ø·" },
        { status: 403 }
      );
    }

    await connectDB();

    // Ù†Ø¬Ù…Ù‘Ø¹ Ø§Ù„Ø±Ø³Ø§Ø¦Ù„ Ø­Ø³Ø¨ roomIdØŒ ÙˆÙ†Ø£Ø®Ø° Ø¢Ø®Ø± Ø±Ø³Ø§Ù„Ø© ÙˆØªØ§Ø±ÙŠØ®Ù‡Ø§ ÙÙŠ ÙƒÙ„ ØºØ±ÙØ©
    const rooms = await ChatMessage.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$roomId",
          lastMessage: { $first: "$message" },
          lastMessageAt: { $first: "$createdAt" },
          lastSenderRole: { $first: "$senderRole" },
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ]);

    // roomId ÙÙŠ ØªØµÙ…ÙŠÙ…Ù†Ø§ = userId Ø§Ù„Ø®Ø§Øµ Ø¨Ø§Ù„Ø¹Ù…ÙŠÙ„ØŒ ÙÙ†Ø¬Ù„Ø¨ Ø§Ø³Ù…Ù‡ Ù„Ø¹Ø±Ø¶Ù‡ Ø¨Ø¯Ù„Ø§Ù‹ Ù…Ù† Ø§Ù„Ø±Ù‚Ù… Ø§Ù„Ù…Ø¬Ø±Ù‘Ø¯
    const roomsWithNames = await Promise.all(
      rooms.map(async (room) => {
        const customer = await User.findById(room._id).select("name email");
        return {
          roomId: room._id,
          customerName: customer?.name || "Ø¹Ù…ÙŠÙ„ Ù…Ø­Ø°ÙˆÙ",
          customerEmail: customer?.email || "",
          lastMessage: room.lastMessage,
          lastMessageAt: room.lastMessageAt,
          lastSenderRole: room.lastSenderRole,
        };
      })
    );

    return NextResponse.json({ status: "success", rooms: roomsWithNames });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


