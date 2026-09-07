export const runtime = 'nodejs';
import { NextRequest } from "next/server";
import crypto from "crypto";

export const CSRF_COOKIE_NAME = "csrf-token";
export const CSRF_HEADER_NAME = "x-csrf-token";

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function verifyCsrfToken(req: NextRequest, method: string): boolean {
  if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    return true;
  }

  const headerToken = req.headers.get(CSRF_HEADER_NAME);
  const cookieToken = req.cookies.get(CSRF_COOKIE_NAME)?.value;

  if (!headerToken || !cookieToken) {
    throw new Error("CSRF token missing");
  }

  const a = Buffer.from(headerToken);
  const b = Buffer.from(cookieToken);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error("CSRF token mismatch");
  }

  return true;
}