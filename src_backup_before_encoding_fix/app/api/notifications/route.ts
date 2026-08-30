import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { status: "error", message: "ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„" },
        { status: 401 }
      );
    }

    await connectDB();

    const notifications = await Notification.find({
      $or: [{ userId: user.userId }, { userId: null }],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = notifications.filter(
      (notification: any) =>
        !notification.isRead &&
        notification.userId?.toString() === user.userId
    ).length;

    return NextResponse.json({
      status: "success",
      notifications,
      unreadCount,
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±" },
      { status: 500 }
    );
  }
}


