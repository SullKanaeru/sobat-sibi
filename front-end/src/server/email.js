// src/server/email.js
import nodemailer from "nodemailer";

// ─── Transporter ───────────────────────────────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function getSenderInfo() {
  return {
    name: process.env.SMTP_FROM_NAME || "Sobat SIBI",
    email: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
  };
}

// ─── Shared layout helper ───────────────────────────────────────────────────────
function buildEmailLayout({ title, preheader, headerColor, headerContent, bodyContent }) {
  return `<!DOCTYPE html>
<html lang="id" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title}</title>
  <!--[if mso]><style>table{border-collapse:collapse}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:'Segoe UI',Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#f9fafb;line-height:1px;">${preheader}&nbsp;&#8199;&#65279;&#847;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;</div>

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9fafb;">
    <tr>
      <td align="center" style="padding:48px 16px;">

        <!-- Email card (max 600px) -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);">

          <!-- ── HEADER ─────────────────────────────────────────── -->
          <tr>
            <td style="background:${headerColor};padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:32px 48px;text-align:center;">
                    <h1 style="margin:0 0 4px;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;line-height:1.2;">Sobat SIBI</h1>
                    <p style="margin:0;color:rgba(255,255,255,0.8);font-size:12px;letter-spacing:0.5px;text-transform:uppercase;font-weight:600;">Belajar Bahasa Isyarat</p>
                  </td>
                </tr>
                ${headerContent}
              </table>
            </td>
          </tr>

          <!-- ── BODY ──────────────────────────────────────────── -->
          <tr>
            <td style="padding:40px 48px 36px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- ── FOOTER ────────────────────────────────────────── -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:24px 48px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="text-align:center;">
                    <p style="margin:0 0 6px;color:#64748b;font-size:12px;line-height:1.6;">
                      Email ini dikirim secara otomatis. Mohon tidak membalas email ini.
                    </p>
                    <p style="margin:0;color:#94a3b8;font-size:11px;">
                      &copy; ${new Date().getFullYear()} Sobat SIBI &bull; Platform Belajar Bahasa Isyarat
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- End card -->

      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── 1. Registration Welcome Email ─────────────────────────────────────────────
export async function sendRegistrationWelcomeEmail({ to, username }) {
  const transporter = createTransporter();
  const { name, email: fromEmail } = getSenderInfo();

  const headerContent = ``;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const bodyContent = `
    <h2 style="margin:0 0 12px;color:#111827;font-size:20px;font-weight:800;line-height:1.3;">Selamat Datang di Sobat SIBI!</h2>
    <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.7;">
      Halo <strong style="color:#1d4ed8;">${username}</strong>, pendaftaran akun Anda telah berhasil.
    </p>

    <!-- Info Box -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:28px;">
      <tr>
        <td style="padding:20px 24px; text-align: left;">
          <p style="margin:0;font-size:14px;color:#374151;font-weight:600;line-height:1.6;">
            Ayo mulai petualangan belajar bahasa isyarat Anda sekarang.
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <div style="text-align:left;margin-bottom:8px;">
      <a href="${appUrl}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:6px;letter-spacing:0.3px;">
        Mulai Belajar
      </a>
    </div>`;

  const html = buildEmailLayout({
    title: "Selamat Datang - Sobat SIBI",
    preheader: `Pendaftaran berhasil, selamat datang di Sobat SIBI ${username}!`,
    headerColor: "#1d4ed8",
    headerContent,
    bodyContent,
  });

  await transporter.sendMail({
    from: `"${name}" <${fromEmail}>`,
    to,
    subject: `Selamat Datang di Sobat SIBI`,
    html,
  });
}

// ─── 2. Password Reset Email ───────────────────────────────────────────────────
export async function sendPasswordResetEmail({ to, username, resetLink }) {
  const transporter = createTransporter();
  const { name, email: fromEmail } = getSenderInfo();

  const headerContent = ``;

  const bodyContent = `
    <h2 style="margin:0 0 12px;color:#111827;font-size:20px;font-weight:800;line-height:1.3;">Reset Kata Sandi</h2>
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.7;">
      Halo <strong style="color:#1d4ed8;">${username}</strong>, kami menerima permintaan untuk mereset kata sandi akun Sobat SIBI Anda.
    </p>
    <p style="margin:0 0 28px;color:#4b5563;font-size:15px;line-height:1.7;">
      Klik tombol di bawah untuk membuat kata sandi baru.
    </p>

    <!-- CTA Button -->
    <div style="text-align:left;margin-bottom:32px;">
      <a href="${resetLink}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:6px;letter-spacing:0.3px;">
        Buat Kata Sandi Baru
      </a>
    </div>

    <!-- Security note -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:28px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 8px;font-size:13px;color:#4b5563;line-height:1.6;">
            Tautan reset ini akan <strong>kedaluwarsa dalam 1 jam</strong>.
          </p>
          <p style="margin:0;font-size:13px;color:#4b5563;line-height:1.6;">
            Jika Anda tidak meminta reset kata sandi, abaikan email ini. Akun Anda tetap aman.
          </p>
        </td>
      </tr>
    </table>

    <!-- Fallback link -->
    <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.8;">
      Jika tombol tidak bekerja, salin dan tempel tautan berikut ke browser Anda:<br />
      <a href="${resetLink}" style="color:#1d4ed8;word-break:break-all;font-size:12px;text-decoration:underline;">${resetLink}</a>
    </p>`;

  const html = buildEmailLayout({
    title: "Reset Kata Sandi - Sobat SIBI",
    preheader: "Permintaan reset kata sandi untuk akun Sobat SIBI Anda",
    headerColor: "#1d4ed8",
    headerContent,
    bodyContent,
  });

  await transporter.sendMail({
    from: `"${name}" <${fromEmail}>`,
    to,
    subject: `Reset Kata Sandi Akun Sobat SIBI`,
    html,
  });
}

// ─── 3. Bug Report Email ───────────────────────────────────────────────────────
export async function sendBugReportEmail({ title, category, description, userEmail, userName, attachment }) {
  const transporter = createTransporter();
  const { name, email: fromEmail } = getSenderInfo();

  const headerContent = ``;

  const bodyContent = `
    <h2 style="margin:0 0 12px;color:#111827;font-size:20px;font-weight:800;line-height:1.3;">Laporan Baru</h2>
    <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.7;">
      Terdapat pesan baru yang dikirimkan melalui Pusat Bantuan.
    </p>

    <!-- Info Box -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:28px;">
      <tr>
        <td style="padding:20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-bottom:12px;border-bottom:1px solid #f3f4f6;">
                <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">Pengirim</p>
                <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:600;">${userName || "Pengguna Anonim"} &lt;${userEmail || "Tidak ada email"}&gt;</p>
              </td>
            </tr>
            <tr>
              <td style="padding-top:12px;padding-bottom:12px;border-bottom:1px solid #f3f4f6;">
                <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">Kategori</p>
                <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:600;">${category || "Lainnya"}</p>
              </td>
            </tr>
            <tr>
              <td style="padding-top:12px;">
                <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">Judul Masalah</p>
                <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:600;">${title || "Tanpa Judul"}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <h3 style="margin:0 0 8px;color:#111827;font-size:14px;font-weight:700;">Deskripsi:</h3>
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin-bottom:24px;white-space:pre-wrap;color:#374151;font-size:14px;line-height:1.6;">
      ${description || "Tidak ada deskripsi"}
    </div>
    ${attachment ? `
    <p style="margin:0;font-size:13px;color:#16a34a;font-weight:600;">
      ✓ Pengguna menyertakan lampiran (${attachment.filename}).
    </p>` : ''}
  `;

  const html = buildEmailLayout({
    title: "Laporan Baru - Sobat SIBI",
    preheader: `Laporan baru dari ${userName || "Anonim"}: ${title}`,
    headerColor: "#1d4ed8",
    headerContent,
    bodyContent,
  });

  await transporter.sendMail({
    from: `"${name}" <${fromEmail}>`,
    to: "sobatsibimu@gmail.com",
    replyTo: userEmail,
    subject: `Laporan: ${title}`,
    html,
    attachments: attachment ? [attachment] : undefined,
  });
}

// ─── 4. Contact Form Email ──────────────────────────────────────────────────────
export async function sendContactEmail({ name, email, category, message }) {
  const transporter = createTransporter();
  const { name: senderName, email: fromEmail } = getSenderInfo();

  const headerContent = ``;

  const bodyContent = `
    <h2 style="margin:0 0 12px;color:#111827;font-size:20px;font-weight:800;line-height:1.3;">Pesan Kontak Baru</h2>
    <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.7;">
      Terdapat pesan baru dari halaman Kontak.
    </p>

    <!-- Info Box -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:28px;">
      <tr>
        <td style="padding:20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-bottom:12px;border-bottom:1px solid #f3f4f6;">
                <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">Pengirim</p>
                <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:600;">${name || "Tanpa Nama"} &lt;${email || "Tidak ada email"}&gt;</p>
              </td>
            </tr>
            <tr>
              <td style="padding-top:12px;">
                <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">Kategori</p>
                <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:600;">${category || "Lainnya"}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <h3 style="margin:0 0 8px;color:#111827;font-size:14px;font-weight:700;">Pesan:</h3>
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin-bottom:24px;white-space:pre-wrap;color:#374151;font-size:14px;line-height:1.6;">
      ${message || "Tidak ada pesan"}
    </div>
  `;

  const html = buildEmailLayout({
    title: "Pesan Kontak Baru - Sobat SIBI",
    preheader: `Pesan kontak dari ${name}: ${category}`,
    headerColor: "#1d4ed8",
    headerContent,
    bodyContent,
  });

  await transporter.sendMail({
    from: `"${senderName}" <${fromEmail}>`,
    to: "sobatsibimu@gmail.com",
    replyTo: email,
    subject: `Kontak: ${category}`,
    html,
  });
}
