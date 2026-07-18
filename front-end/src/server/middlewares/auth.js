// src/middleware/auth.js
import { NextResponse } from "next/server";
import { verifyToken } from "@/server/auth";

export function middleware(request) {
  const token = request.headers.get("authorization")?.split(" ")[1];

  // Public routes that don't require authentication
  const publicPaths = ["/api/auth/login", "/api/auth/register"];
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check token for protected routes
  if (!token) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 },
    );
  }

  // Add user info to headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("user-id", decoded.userId);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: "/api/:path*",
};
