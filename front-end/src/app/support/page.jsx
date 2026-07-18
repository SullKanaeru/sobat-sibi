"use client";

import React, { useState } from "react";
import { Search, Bug, UploadCloud, CheckCircle2, MessageSquare, BookOpen } from "lucide-react";

export default function SupportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    file: null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("category", formData.category);
      data.append("description", formData.description);
      if (formData.file) {
        data.append("file", formData.file);
      }

      const res = await fetch("/api/support/report", {
        method: "POST",
        body: data,
      });

      if (res.ok) {
        setIsSuccess(true);
        setFormData({ title: "", category: "", description: "", file: null });
        setTimeout(() => setIsSuccess(false), 5000);
      } else {
        alert("Gagal mengirim laporan. Silakan coba lagi nanti.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-10">

      {/* Header Section */}
      <header className="mb-10 max-w-3xl mx-auto text-center pt-8">
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Lapor Bug & Saran
        </h1>
        <p className="text-gray-500 text-lg mb-8">
          Gunakan form laporan di bawah untuk mengirimkan keluhan atau saran yang membangun.
        </p>
      </header>

      {/* Main Grid Layout */}
      <div className="max-w-2xl mx-auto w-full">

        {/* Bug Report Form Section */}
        <section className="bg-white border border-gray-200 shadow-sm rounded-lg p-6 md:p-8 flex flex-col relative overflow-hidden">

          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-md">
              <Bug size={24} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Kirim Laporan</h2>
          </div>

          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Laporan Terkirim!</h3>
              <p className="text-gray-500">Terima kasih atas masukannya. Tim kami akan segera meninjaunya.</p>
              <button
                onClick={() => setIsSuccess(false)}
                className="mt-6 text-blue-700 font-semibold hover:underline"
              >
                Kirim Laporan Lain
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col">

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                  Judul Masalah
                </label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                  placeholder="Contoh: Gagal memuat kamus"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                  Kategori
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium appearance-none cursor-pointer"
                >
                  <option value="" disabled>Pilih Kategori</option>
                  <option value="ui">Antarmuka (UI)</option>
                  <option value="functional">Fungsionalitas</option>
                  <option value="content">Konten Pembelajaran</option>
                  <option value="account">Akun & Keamanan</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                  Deskripsi Detail
                </label>
                <textarea
                  required
                  rows="4"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium resize-y"
                  placeholder="Jelaskan apa yang terjadi, langkah-langkah untuk memunculkan masalah, dsb..."
                ></textarea>
              </div>

              <div className="space-y-2 mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                  Lampiran (Opsional)
                </label>
                <label
                  htmlFor="file-upload"
                  className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer group bg-gray-50 block"
                >
                  <div className="w-10 h-10 bg-white shadow-sm rounded-md flex items-center justify-center mx-auto mb-3 text-gray-400 group-hover:text-blue-700 group-hover:shadow-md transition-all">
                    <UploadCloud size={20} />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">
                    {formData.file ? formData.file.name : "Klik atau seret file ke sini"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.file ? `${(formData.file.size / (1024 * 1024)).toFixed(2)} MB` : "Maks. ukuran file: 5MB (JPG, PNG, MP4)"}
                  </p>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,video/mp4"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        if (e.target.files[0].size > 5 * 1024 * 1024) {
                          alert("Ukuran file maksimal 5MB");
                          return;
                        }
                        setFormData({ ...formData, file: e.target.files[0] });
                      }
                    }}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-blue-700 text-white rounded-md font-bold text-sm tracking-wide shadow-sm hover:bg-blue-800 active:scale-[0.98] transition-all focus:outline-none disabled:bg-blue-400 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    MENGIRIM...
                  </>
                ) : (
                  "KIRIM LAPORAN"
                )}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
