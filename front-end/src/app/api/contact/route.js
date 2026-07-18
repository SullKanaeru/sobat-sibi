import { NextResponse } from "next/server";
import { sendContactEmail } from "@/server/email";

export async function POST(request) {
  try {
    const { name, email, category, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "Nama, email, dan pesan wajib diisi." },
        { status: 400 }
      );
    }

    // Kirim email laporan dari form kontak
    await sendContactEmail({
      name,
      email,
      category,
      message,
    });

    return NextResponse.json({ message: "Pesan berhasil dikirim" }, { status: 200 });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Gagal mengirim pesan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
