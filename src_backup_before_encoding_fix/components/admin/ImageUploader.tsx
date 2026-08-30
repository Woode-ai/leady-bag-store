// src/components/admin/ImageUploader.tsx
// Ù…ÙƒÙˆÙ† Ù„Ø±ÙØ¹ ØµÙˆØ±Ø© ÙˆØ§Ø­Ø¯Ø© Ø£Ùˆ Ø£ÙƒØ«Ø±ØŒ ÙˆÙŠØ¹ÙŠØ¯ Ø±ÙˆØ§Ø¨Ø· Ø§Ù„ØµÙˆØ± Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠØ© Ø¨Ø¹Ø¯ Ø§Ù„Ø±ÙØ¹
// ÙŠÙØ³ØªØ®Ø¯Ù… ÙÙŠ ØµÙØ­Ø© Ø¥Ø¶Ø§ÙØ©/ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ø£Ù‚Ø³Ø§Ù… ÙˆØ§Ù„Ù…Ù†ØªØ¬Ø§Øª

"use client";

import { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";

interface ImageUploaderProps {
  images: string[]; // Ø§Ù„ØµÙˆØ± Ø§Ù„Ù…Ø±ÙÙˆØ¹Ø© Ø­Ø§Ù„ÙŠØ§Ù‹ (Ø±ÙˆØ§Ø¨Ø·)
  onChange: (images: string[]) => void;
  multiple?: boolean; // true Ù„Ù„Ù…Ù†ØªØ¬Ø§Øª (Ø¹Ø¯Ø© ØµÙˆØ±)ØŒ false Ù„Ù„Ø£Ù‚Ø³Ø§Ù… (ØµÙˆØ±Ø© ÙˆØ§Ø­Ø¯Ø©)
}

export default function ImageUploader({ images, onChange, multiple = true }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");

    try {
      const uploadedUrls: string[] = [];

      // Ù†Ø±ÙØ¹ ÙƒÙ„ ØµÙˆØ±Ø© Ø¹Ù„Ù‰ Ø­Ø¯Ø© (Cloudinary Ù„Ø§ ÙŠØ¯Ø¹Ù… Ø±ÙØ¹ Ø¹Ø¯Ø© Ù…Ù„ÙØ§Øª ÙÙŠ Ø·Ù„Ø¨ ÙˆØ§Ø­Ø¯ Ø¨Ø³Ù‡ÙˆÙ„Ø©)
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "ÙØ´Ù„ Ø±ÙØ¹ Ø§Ù„ØµÙˆØ±Ø©");
        uploadedUrls.push(data.url);
      }

      onChange(multiple ? [...images, ...uploadedUrls] : uploadedUrls);
    } catch (err: unknown) {
      setError((err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)));
    } finally {
      setUploading(false);
      e.target.value = ""; // Ù†ÙØ±Ù‘Øº Ø­Ù‚Ù„ Ø§Ù„Ù…Ù„Ù Ø­ØªÙ‰ ÙŠÙ…ÙƒÙ† Ø±ÙØ¹ Ù†ÙØ³ Ø§Ù„ØµÙˆØ±Ø© Ù…Ø±Ø© Ø£Ø®Ø±Ù‰ Ø¥Ù† Ø§Ø­ØªØ§Ø¬ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…
    }
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {images.map((img, i) => (
          <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
            <img src={img} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-0.5 end-0.5 bg-black/60 text-white rounded-full p-0.5"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary text-gray-400 hover:text-primary">
          {uploading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Upload size={20} />
          )}
          <input
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}


