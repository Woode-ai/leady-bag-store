import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 1. حماية ضد هجمات CSRF (Cross-Site Request Forgery) لكافة الـ APIs ذات التأثير على البيانات
  if (
    request.nextUrl.pathname.startsWith("/api/") &&
    ["POST", "PUT", "DELETE", "PATCH"].includes(request.method)
  ) {
    // استثناء الـ Webhooks الخارجية مثل Stripe / PayMob
    const isWebhook = request.nextUrl.pathname.startsWith("/api/payment/webhook");

    if (!isWebhook) {
      const origin = request.headers.get("origin");
      const host = request.headers.get("host");

      // إذا كان الطلب يحتوي على Origin خارجي لا يطابق نطاق المتجر، يتم حظره فوراً
      if (origin && host) {
        try {
          const originUrl = new URL(origin);
          if (originUrl.host !== host && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
            return new NextResponse(
              JSON.stringify({ status: "error", message: "طلب غير مصرح به (CSRF/Origin Mismatch)" }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }
        } catch {
          return new NextResponse(
            JSON.stringify({ status: "error", message: "أصل الطلب غير صالح" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      // التحقق من ترويسة Sec-Fetch-Site لمنع الهجمات الموجهة من مواقع خارجية
      const secFetchSite = request.headers.get("sec-fetch-site");
      if (secFetchSite && secFetchSite === "cross-site") {
        return new NextResponse(
          JSON.stringify({ status: "error", message: "Cross-Site requests are forbidden" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' https://api.telegram.org https://api.stripe.com https://accept.paymob.com wss: ws:",
      "frame-src 'self' https://js.stripe.com https://accept.paymob.com",
      "worker-src 'self' blob:",
    ].join("; ")
  );

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};


