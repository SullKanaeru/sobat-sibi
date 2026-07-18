// src/middleware.js
import { NextResponse } from "next/server";
import { verifyToken } from "@/server/jwt";

// Tambahkan rute-rute yang perlu dilindungi di sini
const protectedRoutes = ["/settings", "/dashboard"];
const authRoutes = ["/login", "/register"]; // Rute yang tidak boleh diakses jika sudah login

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Cek apakah rute termasuk protected atau auth
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  // Cek token dari cookies (asumsi nama cookie adalah 'token')
  const tokenCookie = request.cookies.get("token");
  let verifiedPayload = null;
  
  if (tokenCookie) {
    verifiedPayload = await verifyToken(tokenCookie.value);
  }

  // Logika Proteksi
  if (isProtectedRoute && !verifiedPayload) {
    // Belum login, mencoba akses area khusus -> redirect ke home atau /login
    // Karena kita pakai Modal Auth di home, bisa diredirect ke '/'
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAuthRoute && verifiedPayload) {
    // Sudah login, mencoba akses /login atau /register -> redirect ke dashboard
    return NextResponse.redirect(new URL("/settings", request.url));
  }

  return NextResponse.next();
}

// Konfigurasi jalur (paths) mana saja yang akan diproses middleware ini
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
