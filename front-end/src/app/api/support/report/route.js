import { NextResponse } from "next/server";
import { sendBugReportEmail } from "@/server/email";
import { verifyToken } from "@/server/jwt";
import { getUserById } from "@/server/services/user.service";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const title = formData.get("title");
    const category = formData.get("category");
    const description = formData.get("description");
    const file = formData.get("file");

    if (!title || !description) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "Judul dan Deskripsi wajib diisi." },
        { status: 400 }
      );
    }

    // Coba dapatkan data user yang sedang login (opsional)
    let userEmail = "anonim@sobatsibi.id";
    let userName = "Anonim";
    
    try {
      const tokenCookie = request.cookies.get("token");
      if (tokenCookie) {
        const payload = await verifyToken(tokenCookie.value);
        if (payload && payload.userId) {
          const user = await getUserById(payload.userId);
          if (user) {
            userEmail = user.email;
            userName = user.username;
          }
        }
      }
    } catch (e) {
      console.warn("Could not get user for bug report", e);
    }

    let attachment = null;
    if (file && typeof file === 'object' && file.arrayBuffer) {
      const buffer = Buffer.from(await file.arrayBuffer());
      attachment = {
        filename: file.name,
        content: buffer,
        contentType: file.type
      };
    }

    // Kirim email laporan bug
    await sendBugReportEmail({
      title,
      category,
      description,
      userEmail,
      userName,
      attachment
    });

    return NextResponse.json({ message: "Laporan berhasil dikirim" }, { status: 200 });
  } catch (error) {
    console.error("Bug report API error:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Gagal mengirim laporan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
