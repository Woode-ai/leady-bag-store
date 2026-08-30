import { NextRequest } from "next/server";
import { verifyToken, TokenPayload } from "@/lib/jwt";
import { AUTH_COOKIE_NAME } from "@/lib/session";

function getBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

export function getCurrentUser(req: NextRequest): TokenPayload | null {
  const bearerToken = getBearerToken(req);
  const cookieToken = req.cookies.get(AUTH_COOKIE_NAME)?.value || null;

  // Cookie is the preferred browser session mechanism. Authorization remains
  // supported for controlled server-to-server clients and backward compatibility.
  return verifyToken(cookieToken || bearerToken || "");
}

export function requireAdmin(req: NextRequest): TokenPayload | null {
  const user = getCurrentUser(req);
  if (!user || user.role !== "admin") return null;
  return user;
}


