// src/models/User.ts

import mongoose, {
  Schema,
  models,
  model,
  type Model,
} from "mongoose";

export interface IUser {
  _id: string;

  name: string;

  email: string;

  /**
   * كلمة المرور تكون مخزنة بشكل مشفر باستخدام bcrypt.
   */
  password: string;

  /**
   * نوع الحساب.
   */
  role: "customer" | "admin";

  /**
   * رقم الهاتف.
   */
  phone?: string;

  /**
   * عنوان العميل.
   */
  address?: string;

  /**
   * قائمة المنتجات المفضلة.
   */
  wishlist: mongoose.Types.ObjectId[];

  /**
   * إعدادات المصادقة الثنائية 2FA.
   */
  twoFactorSecret?: string;

  twoFactorEnabled: boolean;

  /**
   * حماية تسجيل الدخول من المحاولات الفاشلة.
   */
  failedLoginAttempts: number;

  lockUntil?: Date;

  /**
   * التحقق من البريد الإلكتروني.
   */
  emailVerified: boolean;

  emailVerificationToken?: string;

  emailVerificationCode?: string;

  emailVerificationExpires?: Date;

  /**
   * إعادة تعيين كلمة المرور.
   */
  passwordResetCode?: string;

  passwordResetExpires?: Date;

  /**
   * نقاط الولاء.
   */
  loyaltyPoints: number;

  createdAt: Date;

  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
      index: true,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 30,
    },

    address: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    wishlist: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    /**
     * لا نعيد هذا الحقل عند جلب المستخدم بشكل عادي.
     */
    twoFactorSecret: {
      type: String,
      select: false,
    },

    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    lockUntil: {
      type: Date,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    /**
     * Token قديم/احتياطي للتحقق من البريد.
     */
    emailVerificationToken: {
      type: String,
      select: false,
    },

    /**
     * OTP التحقق من البريد.
     */
    emailVerificationCode: {
      type: String,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    /**
     * OTP إعادة تعيين كلمة المرور.
     */
    passwordResetCode: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },

    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * منع إعادة تعريف Model عند استخدام Next.js
 * في وضع التطوير بسبب Hot Reload.
 */
const User: Model<IUser> =
  (models.User as Model<IUser>) ||
  model<IUser>("User", UserSchema);

export default User;