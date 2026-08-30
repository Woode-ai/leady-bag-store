// src/app/api/upload/route.ts
// POST /api/upload
// ÙŠØ³ØªÙ‚Ø¨Ù„ ØµÙˆØ±Ø© Ù…Ù† Ù„ÙˆØ­Ø© ØªØ­ÙƒÙ… Ø§Ù„Ø£Ø¯Ù…Ù†ØŒ ÙŠØ±ÙØ¹Ù‡Ø§ Ø¥Ù„Ù‰ CloudinaryØŒ ÙˆÙŠØ¹ÙŠØ¯ Ø±Ø§Ø¨Ø·Ù‡Ø§ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ
// Ù‡Ø°Ø§ Ø§Ù„Ø±Ø§Ø¨Ø· Ù‡Ùˆ Ù…Ø§ Ù†Ø®Ø²Ù‘Ù†Ù‡ ÙÙŠ Ø­Ù‚Ù„ images Ø¯Ø§Ø®Ù„ Ø§Ù„Ù…Ù†ØªØ¬ (Product.images)
//
// ÙŠØ¬Ø¨ Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„ØµÙˆØ±Ø© ÙƒÙ€ FormData (ÙˆÙ„ÙŠØ³ JSON) Ù…Ø¹ Ø­Ù‚Ù„ Ø§Ø³Ù…Ù‡ "file"

import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { status: "error", message: "ØºÙŠØ± Ù…ØµØ±Ø­ Ù„Ùƒ - Ø±ÙØ¹ Ø§Ù„ØµÙˆØ± Ù„Ù„Ø£Ø¯Ù…Ù† ÙÙ‚Ø·" },
        { status: 403 }
      );
    }

    // Ø§Ù„Ø³Ø¨Ø¨ Ø§Ù„Ø£Ø´Ù‡Ø± Ù„ÙØ´Ù„ Ø±ÙØ¹ Ø§Ù„ØµÙˆØ± Ù‡Ùˆ Ù†Ø³ÙŠØ§Ù† ØªØ¹Ø¨Ø¦Ø© Ø¨ÙŠØ§Ù†Ø§Øª Cloudinary ÙÙŠ .env.local
    // Ù†ØªØ­Ù‚Ù‚ Ù…Ù† Ù‡Ø°Ø§ ØµØ±Ø§Ø­Ø© Ø£ÙˆÙ„Ø§Ù‹ ÙˆÙ†Ø¹Ø·ÙŠ Ø±Ø³Ø§Ù„Ø© ÙˆØ§Ø¶Ø­Ø©ØŒ Ø¨Ø¯Ù„ Ø±Ø³Ø§Ù„Ø© Cloudinary Ø§Ù„ØªÙ‚Ù†ÙŠØ© Ø§Ù„Ù…Ø¨Ù‡Ù…Ø©
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "Ø±ÙØ¹ Ø§Ù„ØµÙˆØ± ØºÙŠØ± Ù…ÙÙØ¹ÙŽÙ‘Ù„ Ø¨Ø¹Ø¯ - Ø£Ø¶Ù CLOUDINARY_CLOUD_NAME Ùˆ CLOUDINARY_API_KEY Ùˆ CLOUDINARY_API_SECRET ÙÙŠ Ù…Ù„Ù .env.local (Ø§Ø­ØµÙ„ Ø¹Ù„ÙŠÙ‡Ø§ Ù…Ù† Ù„ÙˆØ­Ø© ØªØ­ÙƒÙ… Cloudinary)ØŒ Ø«Ù… Ø£Ø¹Ø¯ ØªØ´ØºÙŠÙ„ Ø§Ù„Ø³ÙŠØ±ÙØ±",
        },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const requestedFolder = formData.get("folder") as string | null;

    if (!file) {
      return NextResponse.json(
        { status: "error", message: "Ù„Ù… ÙŠØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø£ÙŠ Ù…Ù„Ù" },
        { status: 400 }
      );
    }

    // Ù†ØªØ£ÙƒØ¯ Ø£Ù† Ø§Ù„Ù…Ù„Ù ØµÙˆØ±Ø© ÙØ¹Ù„Ø§Ù‹ (ÙˆÙ„ÙŠØ³ Ù…Ù„ÙØ§Ù‹ ØªÙ†ÙÙŠØ°ÙŠØ§Ù‹ Ø£Ùˆ Ø´ÙŠØ¦Ø§Ù‹ Ø®Ø·ÙŠØ±Ø§Ù‹)
    // Ù†Ø±ÙØ¶ ØµØ±Ø§Ø­Ø© SVG Ù„Ø£Ù†Ù‡ ÙŠÙ…ÙƒÙ† Ø£Ù† ÙŠØ­ØªÙˆÙŠ ÙƒÙˆØ¯ JavaScript Ù…Ø¶Ù…Ù‘Ù† (<script> Ø¯Ø§Ø®Ù„ Ù…Ù„Ù SVG) ÙˆÙ‡Ùˆ Ù†ÙˆØ¹
    // Ù…Ø¹Ø±ÙˆÙ Ù…Ù† Ù‡Ø¬Ù…Ø§Øª XSS Ø§Ù„Ù…Ø®Ø²Ù‘Ù† (Stored XSS): Ù„Ùˆ ÙØªØ­ Ø£Ø­Ø¯ Ø§Ù„Ø±Ø§Ø¨Ø· Ù…Ø¨Ø§Ø´Ø±Ø© ÙÙŠ Ø§Ù„Ù…ØªØµÙØ­ØŒ Ù‚Ø¯ ÙŠÙÙ†ÙÙŽÙ‘Ø° Ø§Ù„ÙƒÙˆØ¯
    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedImageTypes.includes(file.type)) {
      return NextResponse.json(
        { status: "error", message: "ØµÙŠØºØ© Ø§Ù„ØµÙˆØ±Ø© ØºÙŠØ± Ù…Ø¯Ø¹ÙˆÙ…Ø© - Ø§Ù„Ù…Ø³Ù…ÙˆØ­: JPEG, PNG, WEBP, GIF ÙÙ‚Ø·" },
        { status: 400 }
      );
    }

    // Ø­Ø¯ Ø£Ù‚ØµÙ‰ 5 Ù…ÙŠØ¬Ø§Ø¨Ø§ÙŠØª Ù„Ù„ØµÙˆØ±Ø© Ø§Ù„ÙˆØ§Ø­Ø¯Ø© - ÙŠÙ…Ù†Ø¹ Ø±ÙØ¹ Ù…Ù„ÙØ§Øª Ø¶Ø®Ù…Ø© Ø¹Ù† Ø·Ø±ÙŠÙ‚ Ø§Ù„Ø®Ø·Ø£ ØªÙØ¨Ø·Ø¦ Ø§Ù„Ù…ÙˆÙ‚Ø¹
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { status: "error", message: "Ø­Ø¬Ù… Ø§Ù„ØµÙˆØ±Ø© ÙƒØ¨ÙŠØ± Ø¬Ø¯Ø§Ù‹ - Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ 5 Ù…ÙŠØ¬Ø§Ø¨Ø§ÙŠØª" },
        { status: 400 }
      );
    }

    // Ù†Ø­ÙˆÙ‘Ù„ Ø§Ù„Ù…Ù„Ù Ø¥Ù„Ù‰ buffer Ø«Ù… Ø¥Ù„Ù‰ base64 Ù„Ù†Ø±ÙØ¹Ù‡ Ø¥Ù„Ù‰ Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    function hasValidSignature(type: string, data: Buffer): boolean {
      if (type === "image/jpeg") {
        return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
      }
      if (type === "image/png") {
        return data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      }
      if (type === "image/gif") {
        return data.length >= 6 && ["GIF87a", "GIF89a"].includes(data.subarray(0, 6).toString("ascii"));
      }
      if (type === "image/webp") {
        return data.length >= 12 &&
          data.subarray(0, 4).toString("ascii") === "RIFF" &&
          data.subarray(8, 12).toString("ascii") === "WEBP";
      }
      return false;
    }

    if (!hasValidSignature(file.type, buffer)) {
      return NextResponse.json(
        { status: "error", message: "Ù…Ø­ØªÙˆÙ‰ Ø§Ù„Ù…Ù„Ù Ù„Ø§ ÙŠØ·Ø§Ø¨Ù‚ Ù†ÙˆØ¹ Ø§Ù„ØµÙˆØ±Ø© Ø§Ù„Ù…Ø¹Ù„Ù†" },
        { status: 400 }
      );
    }

    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Ù†Ø³Ù…Ø­ ÙÙ‚Ø· Ø¨Ù…Ø¬Ù„Ø¯Ø§Øª Ù…Ø­Ø¯Ø¯Ø© Ù…Ø³Ø¨Ù‚Ø§Ù‹ (allowlist) - Ù„Ø§ Ù†Ø³ØªØ®Ø¯Ù… Ø£ÙŠ Ù†Øµ ÙŠØ±Ø³Ù„Ù‡ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ù…Ø¨Ø§Ø´Ø±Ø© ÙÙŠ Ù…Ø³Ø§Ø± Ø§Ù„Ø±ÙØ¹
    // Ø­ØªÙ‰ Ù„Ø§ ÙŠØªÙ…ÙƒÙ† Ø£Ø­Ø¯ Ù…Ù† Ø§Ù„ØªÙ„Ø§Ø¹Ø¨ Ø¨Ù…Ø³Ø§Ø±Ø§Øª Ø§Ù„ØªØ®Ø²ÙŠÙ† ÙÙŠ Ø­Ø³Ø§Ø¨ Cloudinary
    const allowedFolders: Record<string, string> = {
      products: "leadybag/products",
      settings: "leadybag/settings",
      reviews: "leadybag/reviews",
    };
    const folder = allowedFolders[requestedFolder || ""] || allowedFolders.products;

    const uploadResult = await cloudinary.uploader.upload(base64, {
      folder,
      transformation: [
        { quality: "auto" }, // Ø¶ØºØ· ØªÙ„Ù‚Ø§Ø¦ÙŠ Ø°ÙƒÙŠ Ù„Ù„ØµÙˆØ±Ø©
        { fetch_format: "auto" }, // ÙŠØ­ÙˆÙ‘Ù„Ù‡Ø§ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ Ù„Ù€ WebP ÙÙŠ Ø§Ù„Ù…ØªØµÙØ­Ø§Øª Ø§Ù„ØªÙŠ ØªØ¯Ø¹Ù…Ù‡Ø§
      ],
    });

    return NextResponse.json({
      status: "success",
      message: "ØªÙ… Ø±ÙØ¹ Ø§Ù„ØµÙˆØ±Ø© Ø¨Ù†Ø¬Ø§Ø­",
      url: uploadResult.secure_url,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { status: "error", message: "ÙØ´Ù„ Ø±ÙØ¹ Ø§Ù„ØµÙˆØ±Ø©", ...(process.env.NODE_ENV !== "production" && { error: (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) }) },
      { status: 500 }
    );
  }
}


