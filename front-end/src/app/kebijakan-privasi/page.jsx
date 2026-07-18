import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function KebijakanPrivasi() {
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
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Kebijakan Privasi Sobat SIBI</h1>
            <p className="text-sm font-medium text-gray-400">Pembaruan Terakhir: Juli 2026</p>
          </header>

          <div className="space-y-8 text-gray-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Pendahuluan</h2>
              <p>
                Selamat datang di Sobat SIBI. Kami sangat menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi Anda. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda saat Anda menggunakan platform belajar bahasa isyarat kami.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Akses Kamera dan Pemrosesan Visual</h2>
              <p className="mb-4">
                Platform kami menggunakan teknologi <span className="font-semibold italic">Computer Vision</span> untuk mendeteksi gerakan tangan Anda secara <span className="font-semibold italic">real-time</span>.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>
                  <strong className="text-gray-900">Pemrosesan Lokal:</strong> Kami menegaskan bahwa semua akses kamera dan pemrosesan pelacakan gerak tangan (<span className="italic">hand tracking</span>) <strong>terjadi sepenuhnya di perangkat Anda (di dalam browser)</strong>.
                </li>
                <li>
                  <strong className="text-gray-900">Tidak Ada Perekaman:</strong> Sobat SIBI <strong>tidak pernah merekam, menyimpan, atau mengirimkan</strong> <span className="italic">frame</span> video atau foto wajah dan lingkungan Anda ke server kami. Server kami hanya menerima data berupa angka skor akurasi (misal: &quot;Akurasi 90%&quot;) untuk memperbarui progres belajar Anda.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Interaksi Asisten AI (Chatbot)</h2>
              <p className="mb-4">Saat Anda berinteraksi dengan Asisten AI kami:</p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>Transkrip percakapan teks akan diproses secara aman dan mungkin disimpan sementara untuk memberikan konteks obrolan yang relevan selama Anda belajar.</li>
                <li>Kami menyarankan agar Anda tidak membagikan informasi sensitif (seperti nomor identitas atau data finansial) ke dalam kolom obrolan AI.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Data Akun yang Kami Simpan</h2>
              <p className="mb-4">Untuk memberikan pengalaman belajar yang dipersonalisasi, kami menyimpan:</p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>Informasi profil (Nama, Email, Avatar).</li>
                <li>Data progres belajar (Skor modul, poin XP, <span className="italic">streak</span> harian).</li>
                <li>Preferensi pengaturan Anda (Tangan dominan, level akurasi).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Hubungi Kami</h2>
              <p>
                Jika Anda memiliki pertanyaan terkait privasi data Anda di platform kami, silakan sampaikan melalui halaman <Link href="/kontak" className="text-blue-700 hover:underline font-semibold">Kontak</Link>.
              </p>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
