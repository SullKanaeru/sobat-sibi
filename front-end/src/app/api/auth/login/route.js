// src/app/api/auth/login/route.js
import { NextResponse } from "next/server";
import { getUserByEmail } from "@/server/services/user.service";
import { comparePassword } from "@/server/auth";
import { generateToken } from "@/server/jwt";

export async function POST(request) {
  try {
    console.log("Login attempt received");
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "FORMAT_INVALID", message: "Format permintaan tidak valid." },
        { status: 400 },
      );
    }

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "FIELDS_REQUIRED", message: "Email dan kata sandi harus diisi." },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "EMAIL_INVALID", message: "Format email tidak valid." },
        { status: 400 },
      );
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "EMAIL_NOT_FOUND", message: "Email tidak ditemukan. Pastikan email sudah terdaftar atau daftar akun baru." },
        { status: 401 },
      );
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "PASSWORD_WRONG", message: "Kata sandi salah. Periksa kembali kata sandi Anda." },
        { status: 401 },
      );
    }

    const token = await generateToken(user.id, user.email);

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" && (process.env.NEXT_PUBLIC_APP_URL || "").startsWith("https"),
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Terjadi masalah pada server. Coba lagi beberapa saat." },
      { status: 500 },
    );
  }
}

// ─── Helper: parse User-Agent into readable string ───────────────────────────
function parseUserAgent(ua) {
  if (!ua) return "Tidak diketahui";

  let browser = "Browser tidak diketahui";
  let os = "OS tidak diketahui";

  // Detect browser
  if (ua.includes("Edg/")) browser = "Microsoft Edge";
  else if (ua.includes("OPR/") || ua.includes("Opera/")) browser = "Opera";
  else if (ua.includes("Chrome/") && !ua.includes("Chromium/")) browser = "Google Chrome";
  else if (ua.includes("Firefox/")) browser = "Mozilla Firefox";
  else if (ua.includes("Safari/") && !ua.includes("Chrome/")) browser = "Safari";
  else if (ua.includes("MSIE") || ua.includes("Trident/")) browser = "Internet Explorer";

  // Detect OS
  if (ua.includes("Windows NT 10.0")) os = "Windows 10/11";
  else if (ua.includes("Windows NT 6.3")) os = "Windows 8.1";
  else if (ua.includes("Windows NT 6.1")) os = "Windows 7";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";

  return `${browser} di ${os}`;
}
