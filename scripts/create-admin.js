require("dotenv").config({ path: ".env.local" });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function createAdmin() {
  const MONGODB_URI = process.env.MONGODB_URI;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is required.");
  }
  if (!ADMIN_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ADMIN_EMAIL)) {
    throw new Error("ADMIN_EMAIL is required and must be a valid email.");
  }
  if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 16) {
    throw new Error(
      "ADMIN_PASSWORD is required and must be at least 16 characters."
    );
  }

  await mongoose.connect(MONGODB_URI);

  const UserSchema = new mongoose.Schema(
    {
      name: String,
      email: { type: String, unique: true },
      password: String,
      role: String,
      wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
      emailVerified: Boolean,
      twoFactorEnabled: Boolean,
      loyaltyPoints: Number,
    },
    { timestamps: true }
  );

  const User = mongoose.models.User || mongoose.model("User", UserSchema);
  const email = ADMIN_EMAIL.toLowerCase().trim();
  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role !== "admin") {
      existing.role = "admin";
    }
    existing.emailVerified = true;
    await existing.save();
    console.log("Existing account updated to admin.");
    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await User.create({
    name: "مدير المتجر",
    email,
    password: hashedPassword,
    role: "admin",
    wishlist: [],
    emailVerified: true,
    twoFactorEnabled: false,
    loyaltyPoints: 0,
  });

  console.log("Admin account created successfully.");
  console.log(`Email: ${email}`);
  console.log(
    "Password was read from ADMIN_PASSWORD and was not printed for security."
  );
  console.log(
    "Enable 2FA immediately after the first successful login."
  );
}

createAdmin()
  .catch((error) => {
    console.error("Failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
