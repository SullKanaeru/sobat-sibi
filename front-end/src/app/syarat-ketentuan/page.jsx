import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SyaratKetentuan() {
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
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Syarat dan Ketentuan Layanan</h1>
            <p className="text-sm font-medium text-gray-400">Pembaruan Terakhir: Juli 2026</p>
          </header>

          <div className="space-y-8 text-gray-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Penerimaan Syarat</h2>
              <p>
                Dengan mengakses dan menggunakan platform Sobat SIBI, Anda setuju untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju, mohon untuk tidak menggunakan layanan ini.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Sifat Layanan (Tujuan Edukasi)</h2>
              <p className="mb-4">
                Sobat SIBI adalah alat bantu edukasi berbasis teknologi.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>
                  Platform ini dirancang untuk membantu masyarakat belajar Sistem Isyarat Bahasa Indonesia (SIBI) tingkat dasar hingga menengah.
                </li>
                <li>
                  Aplikasi ini <strong>bukan</strong> pengganti Juru Bahasa Isyarat (JBI) profesional. Kami tidak menjamin akurasi 100% pada evaluasi AI, dan isyarat yang diajarkan mungkin memiliki variasi dialek di berbagai daerah.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Penggunaan yang Diperbolehkan</h2>
              <p className="mb-4">Pengguna setuju untuk menggunakan platform ini sebagaimana mestinya. Pengguna dilarang keras:</p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>Mengeksploitasi sistem, melakukan <span className="italic">spamming</span>, atau membebani API Asisten AI kami secara tidak wajar.</li>
                <li>Membagikan akun atau merekayasa balik (<span className="italic">reverse engineering</span>) kode <span className="italic">Computer Vision</span> yang berjalan di platform ini.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Hak Kekayaan Intelektual</h2>
              <p>
                Seluruh aset di dalam platform, termasuk namun tidak terbatas pada teks materi, gambar, animasi GIF instruksi, logo, dan tata letak UI, adalah hak milik Sobat SIBI dan dilindungi oleh undang-undang hak cipta.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Penghentian Akun</h2>
              <p>
                Kami berhak untuk menangguhkan atau menghapus akun pengguna tanpa pemberitahuan sebelumnya jika ditemukan pelanggaran terhadap Syarat dan Ketentuan ini.
              </p>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
