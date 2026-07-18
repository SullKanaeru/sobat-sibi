import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function Aksesibilitas() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-700 transition-colors mb-8 bg-white px-4 py-2 rounded-md shadow-sm border border-gray-200"
        >
          <ArrowLeft size={16} />
          Kembali ke Beranda
        </Link>

        <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 md:p-12">
          <header className="mb-10 border-b border-gray-100 pb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Komitmen Aksesibilitas Kami</h1>
          </header>

          <div className="space-y-8 text-gray-600 leading-relaxed">
            <section>
              <p>
                Sobat SIBI dibangun dengan tujuan mulia: meruntuhkan tembok komunikasi antara masyarakat umum dan Teman Tuli. Oleh karena itu, kami berkomitmen penuh untuk menjadikan platform ini ramah, inklusif, dan dapat diakses oleh siapa saja.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Fitur Aksesibilitas di Sobat SIBI</h2>
              <p className="mb-4">
                Kami terus melakukan perbaikan antarmuka agar memenuhi standar aksesibilitas web (WCAG). Saat ini, platform kami mendukung:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>
                  <strong className="text-gray-900">Navigasi Keyboard:</strong> Anda dapat menelusuri materi pembelajaran dan berpindah halaman tanpa menggunakan <span className="italic">mouse</span>.
                </li>
                <li>
                  <strong className="text-gray-900">Teks Alternatif (Alt-Text):</strong> Seluruh aset visual (GIF dan Gambar) pembentuk gestur tangan telah dilengkapi deskripsi yang dapat dibaca oleh <span className="italic">Screen Reader</span>.
                </li>
                <li>
                  <strong className="text-gray-900">Kontras Visual:</strong> Desain warna antarmuka kami dirancang agar teks instruksi tetap terbaca dengan jelas.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Kendala Aksesibilitas?</h2>
              <p>
                Kami menyadari bahwa aplikasi berbasis kamera bisa menjadi tantangan tersendiri bagi sebagian perangkat atau pengguna. Jika Anda mengalami kesulitan dalam menggunakan fitur Sobat SIBI, menemukan teks yang sulit dibaca, atau memiliki saran untuk membuat kami lebih inklusif, jangan ragu untuk memberi tahu kami melalui halaman <Link href="/kontak" className="text-blue-700 hover:underline font-semibold">Kontak</Link>. Kami sangat menghargai masukan Anda.
              </p>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
