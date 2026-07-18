// ── components/kamus/SignDetail.jsx ───────────────────────────────────────────
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Play, Lightbulb, ArrowRight, X } from "lucide-react";

export default function SignDetail({ item, type, onPractice }) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Reset video jika user berpindah huruf/angka
  useEffect(() => {
    setIsVideoPlaying(false);
  }, [item, type]);

  const isAlphabet = type === "Alphabet";

  // Penentuan Path Gambar berdasarkan tipe tab yang sedang aktif
  const imagePath = isAlphabet
    ? `/images/dict/huruf/sibi_${item.toLowerCase()}.png`
    : `/images/dict/angka/sibi_${item.toLowerCase()}.png`;

  const videoPath = isAlphabet
    ? `/videos/dict/sibi_${item.toLowerCase()}.mp4`
    : `/videos/dict/sample.mp4`;

  const labelTitle = isAlphabet ? `Huruf '${item}'` : `Angka '${item}'`;

  // Opsional: Anda bisa membuat objek tips & deskripsi untuk angka juga nanti
  const tips = {
    A: "Pastikan telapak tangan Anda menghadap ke depan dan jari-jari terkepal rapat membentuk tinju, dengan ibu jari bersandar di samping jari telunjuk.",
    1: "Angkat jari telunjuk saja, pastikan telapak tangan menghadap ke depan.",
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 1. Kartu Ilustrasi Utama & Video */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 relative flex-1 min-h-[350px] flex items-center justify-center overflow-hidden">
        {isVideoPlaying ? (
          <div className="relative w-full h-full bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center animate-in fade-in zoom-in-95 duration-300">
            <video
              src={videoPath}
              autoPlay
              controls
              className="w-full h-full object-contain"
              onEnded={() => setIsVideoPlaying(false)}
            >
              Maaf, browser Anda tidak mendukung tag video.
            </video>
            <button
              onClick={() => setIsVideoPlaying(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full flex items-center justify-center shadow-lg border border-white/10 transition-all active:scale-95 focus:outline-none z-50 group"
              aria-label="Tutup Video"
            >
              <X size={18} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        ) : (
          <div className="absolute inset-0 top-8 bottom-32 left-8 right-8 opacity-90 transition-opacity duration-300">
            <Image
              src={imagePath}
              alt={`Ilustrasi isyarat ${item}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain"
              priority
            />
            {/* Teks transparan di belakang gambar */}
            <div className="absolute inset-0 flex items-center justify-center text-[150px] font-black text-gray-100 -z-10 select-none">
              {item}
            </div>
          </div>
        )}

        {/* Floating Card Info */}
        <div
          className={`absolute bottom-6 left-6 right-6 bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-white/50 flex justify-between items-center transition-all duration-300 ${isVideoPlaying
            ? "opacity-0 translate-y-4 pointer-events-none"
            : "opacity-100 translate-y-0"
            }`}
        >
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {labelTitle}
            </h3>
            <p className="text-gray-600 text-sm font-medium">
              Peragakan sesuai gambar petunjuk.
            </p>
          </div>

          <button
            onClick={() => setIsVideoPlaying(true)}
            className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-md shadow-indigo-200 transition-transform active:scale-95 focus:outline-none"
          >
            <Play fill="currentColor" size={20} className="ml-1" />
          </button>
        </div>

      </div>

      {/* 2. Kartu Informasi Bawah */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[160px] flex-shrink-0">
        {/* Practice Mode Button */}
        <div
          onClick={onPractice}
          className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 flex items-center justify-between cursor-pointer group hover:border-indigo-200 hover:shadow-md transition-all h-full"
        >
          <div>
            <h4 className="font-bold text-gray-900 mb-1">Kamera Pintar</h4>
            <p className="text-gray-500 text-sm">Uji akurasi Anda dengan AI</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
            <ArrowRight size={20} strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </div>
  );
}
