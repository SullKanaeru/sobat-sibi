// ── app/page.jsx (Dashboard) ───────────────────────────────────────────────────
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Play,
  Volume2,
  BookOpen,
  HelpCircle,
  Bot,
  Flame,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";

export default function GesturaDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ learnedCount: 0 });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch stats
    fetch("/api/user/stats")
      .then(res => {
        if (res.ok) return res.json();
        return null;
      })
      .then(data => {
        if (data && data.learnedCount !== undefined) {
          setStats(data);
        }
      })
      .catch(err => {
        // Silently ignore if failed (e.g. not logged in)
      });

    // Fetch user profile
    fetch("/api/user/me")
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Not logged in");
      })
      .then(data => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="relative bg-white rounded-lg p-6 md:p-8 overflow-hidden shadow-sm border border-gray-200">
        <div className="relative z-10 w-full md:w-3/5">
          {/* Heading */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 leading-tight tracking-tight">
            {user ? (
              <>
                Selamat datang kembali, <br />
                <span className="text-blue-700">{user.username}!</span>
              </>
            ) : (
              <>
                Selamat datang di <br />
                <span className="text-blue-700">Sobat SIBI!</span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="text-gray-500 text-sm md:text-base max-w-md mb-6 leading-relaxed">
            Tempat yang tepat untuk kamu belajar bahasa isyarat dengan SIBI (Sistem Bahasa Isyarat Indonesia).
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  window.dispatchEvent(new Event('require-login'));
                } else {
                  router.push('/lessons');
                }
              }}
              className="bg-blue-700 text-white px-5 py-2.5 rounded-md text-sm font-semibold flex items-center gap-2 hover:bg-blue-800 active:scale-[0.98] transition-all shadow-sm"
            >
              <Play size={16} fill="currentColor" />
              Lanjutkan Pelajaran
            </button>
            <button
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  window.dispatchEvent(new Event('require-login'));
                } else {
                  router.push('/settings');
                }
              }}
              className="bg-white text-blue-700 border border-gray-200 px-5 py-2.5 rounded-md text-sm font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all"
            >
              Lihat Kemajuan
            </button>
          </div>
        </div>

        {/* Optional: Placeholder for the right side graphic mentioned in the design */}
        <div className="absolute right-[-5%] top-[10%] w-[45%] h-[80%] hidden lg:block opacity-90 rounded-2xl overflow-hidden pointer-events-none">
          {/* Anda bisa menaruh Image graphic/dashboard preview di sini */}
          <div className="w-full h-full bg-gradient-to-tr from-indigo-100 to-purple-50 rounded-2xl border-4 border-white/60 shadow-lg transform rotate-2"><Image src="/images/hero-dashboard.png" alt="Dashboard" width={500} height={500} priority style={{ width: '100%', height: 'auto' }} /></div>
        </div>
      </section>

      {/* Explore Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
            Jelajahi Sobat SIBI
          </h2>
        </div>

        {/* Bento Grid Layout - Compact */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
          {/* Card 1: Pelajaran SIBI */}
          <div
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                window.dispatchEvent(new Event('require-login'));
              } else {
                router.push('/lessons');
              }
            }}
            className="md:col-span-1 lg:col-span-3 bg-white rounded-lg p-5 relative overflow-hidden shadow-sm transition-all cursor-pointer group border border-gray-200 flex flex-col justify-between min-h-[160px] hover:border-gray-300"
          >
            <div className="absolute right-0 bottom-0 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-4 translate-y-4 text-gray-900">
              <GraduationCap size={100} />
            </div>
            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className="w-10 h-10 bg-blue-50 text-blue-700 rounded-md flex items-center justify-center">
                <GraduationCap size={20} />
              </div>
              <span className="text-[10px] font-bold tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                BELAJAR
              </span>
            </div>
            <div className="relative z-10 mt-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
                Belajar SIBI
              </h3>
              <p className="text-gray-500 text-xs">
                Modul belajar terstruktur interaktif.
              </p>
            </div>
          </div>

          {/* Card 2: Kamus SIBI */}
          <div
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                window.dispatchEvent(new Event('require-login'));
              } else {
                router.push('/kamus');
              }
            }}
            className="md:col-span-1 lg:col-span-3 bg-white rounded-lg p-5 relative overflow-hidden shadow-sm transition-all cursor-pointer group border border-gray-200 flex flex-col justify-between min-h-[160px] hover:border-gray-300"
          >
            <div className="absolute right-0 bottom-0 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-4 translate-y-4 text-gray-900">
              <BookOpen size={100} />
            </div>

            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className="w-10 h-10 bg-blue-50 text-blue-700 rounded-md flex items-center justify-center">
                <BookOpen size={20} />
              </div>
              <span className="text-[10px] font-bold tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                BELAJAR
              </span>
            </div>
            <div className="relative z-10 mt-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
                Kamus SIBI
              </h3>
              <p className="text-gray-500 text-xs">
                Kamus visual & panduan video isyarat.
              </p>
            </div>
          </div>

          {/* Card 3: AI Bibo */}
          <div
            onClick={() => document.dispatchEvent(new CustomEvent('toggle-chatbot'))}
            className="md:col-span-1 lg:col-span-3 bg-white rounded-lg p-5 relative overflow-hidden shadow-sm transition-all cursor-pointer group border border-gray-200 flex flex-col justify-between min-h-[160px] hover:border-gray-300"
          >
            <div className="absolute right-0 bottom-0 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-4 translate-y-4 text-gray-900">
              <Bot size={100} />
            </div>
            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className="w-10 h-10 bg-blue-50 text-blue-700 rounded-md flex items-center justify-center shadow-none">
                <Bot size={20} />
              </div>
              <span className="text-[10px] font-bold tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                BETA
              </span>
            </div>
            <div className="relative z-10 mt-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
                AI Bibo
              </h3>
              <p className="text-gray-500 text-xs">
                Praktik langsung percakapan dengan AI.
              </p>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}
