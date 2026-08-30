import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/session";

export async function POST() {
  return clearAuthCookie(
    NextResponse.json({
      status: "success",
      message: "ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬ Ø¨Ù†Ø¬Ø§Ø­",
    })
  );
}


