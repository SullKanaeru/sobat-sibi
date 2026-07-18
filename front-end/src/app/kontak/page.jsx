"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";

export default function Kontak() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsSuccess(true);
        setFormData({ name: "", email: "", category: "", message: "" });
      } else {
        alert("Gagal mengirim pesan. Silakan coba lagi.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 md:p-12 mb-8">
          <header className="mb-10 border-b border-gray-100 pb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Hubungi Kami</h1>
          </header>

          <div className="space-y-8 text-gray-600 leading-relaxed">
            <section>
              <p>
                Punya pertanyaan seputar materi SIBI, menemukan kendala teknis saat menyalakan kamera, atau ingin memberikan masukan untuk Asisten AI kami? Tim Sobat SIBI siap mendengar dari Anda.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Formulir Pesan</h2>

              {isSuccess ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center text-green-800">
                  <h3 className="font-bold text-lg mb-2">Pesan Berhasil Terkirim!</h3>
                  <p>Terima kasih telah menghubungi kami. Tim kami akan merespons melalui email yang Anda berikan.</p>
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="mt-4 text-sm font-bold text-blue-700 hover:underline"
                  >
                    Kirim pesan lain
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-gray-700">Nama Lengkap</label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-gray-700">Alamat Email</label>
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-gray-700">Kategori Pesan</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Pilih Kategori</option>
                      <option value="bantuan">Bantuan Teknis Kamera</option>
                      <option value="masukan">Masukan Materi SIBI</option>
                      <option value="kerjasama">Kerjasama</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-gray-700">Isi Pesan</label>
                    <textarea
                      required
                      rows="5"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium resize-y"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto px-8 py-3 bg-blue-700 text-white rounded-md font-bold shadow-sm hover:bg-blue-800 transition-colors disabled:bg-blue-400 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? "Mengirim..." : (
                      <>
                        <Send size={18} />
                        Kirim Pesan
                      </>
                    )}
                  </button>
                </form>
              )}
            </section>

            <section className="pt-8 border-t border-gray-100 mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Informasi Kontak Langsung</h2>
              <p className="mb-4">
                Jika Anda mewakili instansi pendidikan atau komunitas yang ingin berkolaborasi, Anda juga dapat menghubungi kami secara langsung melalui:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>
                  <strong className="text-gray-900">Email:</strong> <a href="mailto:sobatsibimu@gmail.id" className="text-blue-700 hover:underline">sobatsibimu@gmail.com</a>
                </li>
                <li>
                  <strong className="text-gray-900">Instagram:</strong> <a href="https://www.instagram.com/zulhan.arif_/" target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">@zulhan.arif_</a>
                </li>
              </ul>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
