// src/app/api/auth/reset-password/route.js
import { NextResponse } from "next/server";
import prisma from "@/server/db";
import { hashPassword } from "@/server/auth";

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "FORMAT_INVALID", message: "Format permintaan tidak valid." },
        { status: 400 }
      );
    }

    const { token, password, confirmPassword } = body;

    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "FIELDS_REQUIRED", message: "Token, kata sandi baru, dan konfirmasi wajib diisi." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "PASSWORD_TOO_SHORT", message: "Kata sandi minimal 8 karakter." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "PASSWORD_MISMATCH", message: "Konfirmasi kata sandi tidak cocok." },
        { status: 400 }
      );
    }

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "TOKEN_INVALID", message: "Tautan reset tidak valid atau sudah pernah digunakan." },
        { status: 400 }
      );
    }

    if (resetToken.used) {
      return NextResponse.json(
        { error: "TOKEN_USED", message: "Tautan reset ini sudah digunakan. Silakan minta tautan baru." },
        { status: 400 }
      );
    }

    if (new Date() > resetToken.expires_at) {
      return NextResponse.json(
        { error: "TOKEN_EXPIRED", message: "Tautan reset sudah kedaluwarsa (berlaku 1 jam). Silakan minta tautan baru." },
        { status: 400 }
      );
    }

    // Update password and mark token as used
    const hashedPassword = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.user_id },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({
      message: "Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru Anda."
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Terjadi masalah pada server. Coba lagi beberapa saat." },
      { status: 500 }
    );
  }
}

// GET: Verify token validity (called when user lands on reset page)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ valid: false, error: "TOKEN_MISSING" });
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken || resetToken.used || new Date() > resetToken.expires_at) {
    return NextResponse.json({ valid: false, error: "TOKEN_INVALID" });
  }

  return NextResponse.json({ valid: true });
}
