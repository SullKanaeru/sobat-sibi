// src/app/api/auth/register/route.js
import { NextResponse } from "next/server";
import { createUser, getUserByEmail } from "@/server/services/user.service";
import { generateToken } from "@/server/jwt";
import { sendRegistrationWelcomeEmail } from "@/server/email";

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "FORMAT_INVALID", message: "Format permintaan tidak valid." },
        { status: 400 },
      );
    }

    const { username, phone, email, password } = body;

    // Required fields check
    if (!username || !email || !password || !phone) {
      return NextResponse.json(
        { error: "FIELDS_REQUIRED", message: "Semua kolom wajib diisi: nama pengguna, nomor telepon, email, dan kata sandi." },
        { status: 400 },
      );
    }

    // Username length
    if (username.trim().length < 3) {
      return NextResponse.json(
        { error: "USERNAME_TOO_SHORT", message: "Nama pengguna minimal 3 karakter." },
        { status: 400 },
      );
    }

    // Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "EMAIL_INVALID", message: "Format email tidak valid. Contoh: nama@email.com" },
        { status: 400 },
      );
    }

    // Phone format (Indonesian: starts with 0 or +62, 9-13 digits)
    const phoneClean = phone.replace(/[\s\-().]/g, "");
    const phoneRegex = /^(\+62|62|0)[0-9]{8,13}$/;
    if (!phoneRegex.test(phoneClean)) {
      return NextResponse.json(
        { error: "PHONE_INVALID", message: "Nomor telepon tidak valid. Gunakan format Indonesia, contoh: 0812-3456-7890." },
        { status: 400 },
      );
    }

    // Password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: "PASSWORD_TOO_SHORT", message: "Kata sandi minimal 8 karakter." },
        { status: 400 },
      );
    }

    // Email uniqueness
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "EMAIL_TAKEN", message: "Email ini sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda." },
        { status: 409 },
      );
    }

    // Create user
    const user = await createUser({ username, email, phone: phoneClean, password });

    // Generate JWT token
    const token = await generateToken(user.id, user.email);

    const response = NextResponse.json(
      { message: "Registrasi berhasil", user },
      { status: 201 },
    );

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" && (process.env.NEXT_PUBLIC_APP_URL || "").startsWith("https"),
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    // Send registration welcome email
    sendRegistrationWelcomeEmail({
      to: user.email,
      username: user.username,
    }).catch((err) => {
      console.warn("Welcome email failed (non-critical):", err.message);
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Terjadi masalah pada server. Coba lagi beberapa saat." },
      { status: 500 },
    );
  }
}
