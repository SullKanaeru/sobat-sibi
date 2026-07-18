"use client";

import React from "react";
import { CheckCircle2, Shield, HeartHandshake, Code2, Sparkles, Mail, ExternalLink } from "lucide-react";
import Image from "next/image";

export default function TentangPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 sm:px-6 font-sans">
      <div className="max-w-3xl mx-auto">

        {/* Hero Section */}
        <section className="pb-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-blue-700 text-white rounded-lg font-black text-3xl shadow-sm rotate-3">
            S
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Sobat SIBI
          </h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Membuka sekat komunikasi, satu isyarat pada satu waktu.
          </p>
        </section>

        <div className="space-y-6">

          {/* Tentang Aplikasi */}
          <section className="bg-white rounded-lg border border-gray-100 p-8 md:p-10 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2.5 bg-blue-50 rounded-lg">
                <Sparkles size={24} className="text-blue-600" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Tentang Aplikasi</h2>
            </div>
            <div className="text-gray-600 leading-relaxed space-y-6">
              <p>
                Sobat SIBI lahir dari visi untuk menjembatani komunikasi antara masyarakat luas dengan Teman Tuli. Kami percaya bahwa bahasa tidak seharusnya menjadi penghalang, melainkan penyatu.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="text-blue-600 mt-1 shrink-0" size={18} strokeWidth={2.5} />
                  <span className="text-sm font-medium">Pembelajaran Isyarat Interaktif</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="text-blue-600 mt-1 shrink-0" size={18} strokeWidth={2.5} />
                  <span className="text-sm font-medium">Deteksi AI Secara Langsung</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="text-blue-600 mt-1 shrink-0" size={18} strokeWidth={2.5} />
                  <span className="text-sm font-medium">Kurikulum Terstruktur & Terarah</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="text-blue-600 mt-1 shrink-0" size={18} strokeWidth={2.5} />
                  <span className="text-sm font-medium">Lingkungan Ramah Inklusi</span>
                </div>
              </div>
            </div>
          </section>

          {/* Komitmen Kami */}
          <section className="bg-gradient-to-br from-blue-700 to-indigo-800 rounded-lg p-8 md:p-10 text-center shadow-md relative overflow-hidden">
            <HeartHandshake size={32} className="mx-auto mb-6 text-blue-200" strokeWidth={1.5} />
            <blockquote className="text-lg md:text-xl font-medium leading-relaxed text-blue-50 relative z-10">
              "Kami berkomitmen menghadirkan teknologi yang mudah digunakan, relevan, dan terus berkembang untuk merajut masyarakat yang inklusif."
            </blockquote>
          </section>

          {/* Tim Pengembang */}
          <section className="bg-white rounded-lg border border-gray-100 p-8 md:p-10 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-2.5 bg-blue-50 rounded-lg">
                <Code2 size={24} className="text-blue-600" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Tim Pengembang</h2>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-24 h-24 shrink-0 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shadow-inner overflow-hidden relative">
                <Image src="/images/dev-pic.jpeg" alt="Zulhan Arif" fill className="object-cover" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-bold text-gray-900">Zulhan Arif Fasya Hidayat</h3>
                <p className="text-gray-500 text-sm mb-4">Full Stack Developer & AI Engineer</p>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  Bertanggung jawab merancang arsitektur aplikasi, membangun model Computer Vision untuk deteksi isyarat, hingga menyatukannya dalam antarmuka yang ramah pengguna.
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-5">
                  <a href="mailto:sobatsibimu@gmail.com" className="text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-2 text-sm font-medium">
                    <Mail size={16} /> Email
                  </a>
                  <a href="https://www.instagram.com/zulhan.arif_/" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-2 text-sm font-medium">
                    <ExternalLink size={16} /> Instagram
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Grid Bawah: Info & Kontak */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white rounded-lg border border-gray-100 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Shield size={20} className="text-blue-600" strokeWidth={1.5} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Informasi Sistem</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Versi Rilis</span>
                  <span className="font-semibold text-gray-900">1.0.0</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Tahun</span>
                  <span className="font-semibold text-gray-900">2026</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className="flex items-center gap-2 font-semibold text-gray-900">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Aktif
                  </span>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-lg border border-gray-100 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Mail size={20} className="text-blue-600" strokeWidth={1.5} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Kontak Resmi</h2>
              </div>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Punya pertanyaan, saran, atau masukan terkait aplikasi?
              </p>
              <a href="mailto:sobatsibimu@gmail.com" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                sobatsibimu@gmail.com
                <ExternalLink size={16} />
              </a>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}
