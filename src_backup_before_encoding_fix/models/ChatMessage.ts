// src/models/ChatMessage.ts
// ÙŠØ®Ø²Ù‘Ù† Ø±Ø³Ø§Ø¦Ù„ Ø§Ù„Ø¯Ø±Ø¯Ø´Ø© Ø§Ù„Ù…Ø¨Ø§Ø´Ø±Ø© Ø¨ÙŠÙ† Ø§Ù„Ø¹Ù…ÙŠÙ„ ÙˆØ§Ù„Ø£Ø¯Ù…Ù† (Ù„Ù„Ø§Ø­ØªÙØ§Ø¸ Ø¨Ø³Ø¬Ù„ Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø©)

import { Schema, models, model, Types } from "mongoose";

export interface IChatMessage {
  _id: string;
  roomId: string; // Ø¹Ø§Ø¯Ø© ØªÙƒÙˆÙ† userId Ø§Ù„Ø®Ø§Øµ Ø¨Ø§Ù„Ø¹Ù…ÙŠÙ„ØŒ Ø¨Ø­ÙŠØ« Ù„ÙƒÙ„ Ø¹Ù…ÙŠÙ„ "ØºØ±ÙØ©" Ù…Ø­Ø§Ø¯Ø«Ø© ÙˆØ§Ø­Ø¯Ø© Ù…Ø¹ Ø§Ù„Ø£Ø¯Ù…Ù†
  senderId: string;
  senderRole: "customer" | "admin";
  message: string;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    roomId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderRole: { type: String, enum: ["customer", "admin"], required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export default models.ChatMessage || model<IChatMessage>("ChatMessage", ChatMessageSchema);

ChatMessageSchema.index({ roomId: 1, createdAt: 1 });


