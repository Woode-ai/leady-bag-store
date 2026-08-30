// src/models/Notification.ts
import mongoose, { Schema, models, model } from "mongoose";

export interface INotification {
  _id: string;
  userId?: mongoose.Types.ObjectId | null;
  title: string;
  message: string;
  type: "order_status" | "payment_update" | "new_look" | "system";
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["order_status", "payment_update", "new_look", "system"],
      default: "system",
    },
    isRead: { type: Boolean, default: false },
    link: { type: String },
  },
  { timestamps: true }
);

export default models.Notification || model<INotification>("Notification", NotificationSchema);


