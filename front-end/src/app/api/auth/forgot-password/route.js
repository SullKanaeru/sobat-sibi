// src/app/api/auth/forgot-password/route.js
import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/server/db";
import { getUserByEmail } from "@/server/services/user.service";
import { sendPasswordResetEmail } from "@/server/email";

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

    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "EMAIL_REQUIRED", message: "Email wajib diisi." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "EMAIL_INVALID", message: "Format email tidak valid." },
        { status: 400 }
      );
    }

    // Always respond with success to prevent email enumeration
    const user = await getUserByEmail(email);
    if (!user) {
      // Don't reveal whether the email exists
      return NextResponse.json({
        message: "Jika email terdaftar, tautan reset akan dikirim ke kotak masuk Anda."
      });
    }

    // Invalidate previous tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { user_id: user.id, used: false },
      data: { used: true },
    });

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        user_id: user.id,
        token,
        expires_at: expiresAt,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/auth/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail({
        to: user.email,
        username: user.username,
        resetLink,
      });
    } catch (emailError) {
      console.error("Email send error:", emailError);
      return NextResponse.json(
        { error: "EMAIL_SEND_FAILED", message: "Gagal mengirim email. Pastikan konfigurasi SMTP sudah benar." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Jika email terdaftar, tautan reset akan dikirim ke kotak masuk Anda."
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Terjadi masalah pada server. Coba lagi beberapa saat." },
      { status: 500 }
    );
  }
}
