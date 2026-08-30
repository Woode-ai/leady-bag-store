/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  // السماح بأي رابط ينتهي بـ trycloudflare.com لكي لا تحتاج لتغييره في كل مرة
  allowedDevOrigins: [
    "exclusion-carpet-sega-appear.trycloudflare.com",
    // أو استخدام تعبير مرن إذا أردت، أو وضع الرابط الحالي
  ],
};

module.exports = nextConfig;