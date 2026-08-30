// src/models/User.ts
// Ù‡Ø°Ø§ Ø§Ù„Ù…Ù„Ù ÙŠØ¹Ø±Ù‘Ù "Ø´ÙƒÙ„" Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø¯Ø§Ø®Ù„ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª
// ÙƒÙ„ Ù…Ø³ØªØ®Ø¯Ù… (Ø¹Ù…ÙŠÙ„ Ø£Ùˆ Ø£Ø¯Ù…Ù†) Ø³ÙŠÙƒÙˆÙ† Ù„Ù‡ Ø³Ø¬Ù„ Ø¨Ù‡Ø°Ø§ Ø§Ù„Ø´ÙƒÙ„ Ø¨Ø§Ù„Ø¶Ø¨Ø·

import mongoose, { Schema, models, model } from "mongoose";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string; // Ø³ÙŠØªÙ… ØªØ´ÙÙŠØ±Ù‡Ø§ Ø¨Ù€ bcrypt Ù‚Ø¨Ù„ Ø§Ù„Ø­ÙØ¸ØŒ Ù„Ù† ØªÙØ®Ø²Ù† Ø£Ø¨Ø¯Ø§Ù‹ ÙƒÙ†Øµ Ø¹Ø§Ø¯ÙŠ
  role: "customer" | "admin"; // Ù†ÙˆØ¹ Ø§Ù„Ø­Ø³Ø§Ø¨: Ø¹Ù…ÙŠÙ„ Ø¹Ø§Ø¯ÙŠ Ø£Ùˆ Ù…Ø¯ÙŠØ± Ø§Ù„Ù…ØªØ¬Ø±
  phone?: string;
  address?: string;
  wishlist: mongoose.Types.ObjectId[]; // Ù‚Ø§Ø¦Ù…Ø© Ø£Ù…Ù†ÙŠØ§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… (Ø±ÙˆØ§Ø¨Ø· Ù„Ù…Ù†ØªØ¬Ø§Øª)
  twoFactorSecret?: string; // Ø§Ù„Ø³Ø± Ø§Ù„Ø®Ø§Øµ Ø¨ØªÙˆÙ„ÙŠØ¯ Ø£ÙƒÙˆØ§Ø¯ Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø© Ø§Ù„Ø«Ù†Ø§Ø¦ÙŠØ© (2FA)
  twoFactorEnabled: boolean;
  failedLoginAttempts: number;
  lockUntil?: Date;
  emailVerified: boolean; // Ù‡Ù„ Ø£ÙƒÙ‘Ø¯ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø¨Ø±ÙŠØ¯Ù‡ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØŸ
  emailVerificationToken?: string;
  emailVerificationCode?: string; // Ø±Ù…Ø² ØªØ­Ù‚Ù‚ Ù…ÙƒÙˆÙ† Ù…Ù† 6 Ø£Ø±Ù‚Ø§Ù… (OTP)
  emailVerificationExpires?: Date;
  passwordResetCode?: string; // Ø±Ù…Ø² Ø¥Ø¹Ø§Ø¯Ø© ØªØ¹ÙŠÙŠÙ† ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± (OTP)
  passwordResetExpires?: Date;
  loyaltyPoints: number; // Ø±ØµÙŠØ¯ Ù†Ù‚Ø§Ø· Ø§Ù„ÙˆÙ„Ø§Ø¡ ÙˆØ§Ù„Ù…ÙƒØ§ÙØ¢Øª
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    phone: { type: String },
    address: { type: String },
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    twoFactorSecret: { type: String, select: false },
    twoFactorEnabled: { type: Boolean, default: false },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationCode: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetCode: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    loyaltyPoints: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default models.User || model<IUser>("User", UserSchema);


