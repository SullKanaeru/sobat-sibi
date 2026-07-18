"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Award, Medal, Flame, Brain, RefreshCw, ArrowRight } from "lucide-react";

function ModuleSummaryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonId = searchParams.get('lessonId');

  const [confetti, setConfetti] = useState([]);
  const [nextLessonData, setNextLessonData] = useState(null);

  useEffect(() => {
    // Generate confetti pieces
    const colors = ['#5e3bdb', '#a6b5fd', '#cabeff', '#d8e3fb'];
    const newConfetti = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + 'vw',
      animationDelay: Math.random() * 2 + 's',
      animationDuration: Math.random() * 2 + 2 + 's',
      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
      isCircle: Math.random() > 0.5
    }));
    setConfetti(newConfetti);

    // Fetch next lesson if lessonId exists
    if (lessonId) {
      fetch(`/api/lessons/${lessonId}/next`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setNextLessonData(data);
          }
        })
        .catch(err => console.error("Error fetching next lesson:", err));
    }
  }, [lessonId]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#f9f9ff] flex items-center justify-center overflow-hidden text-gray-900">
      {/* Ambient Background Mesh */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-50" style={{
        backgroundImage: `
          radial-gradient(at 0% 0%, hsla(253,16%,7%,0.05) 0, transparent 50%), 
          radial-gradient(at 50% 0%, hsla(225,39%,30%,0.05) 0, transparent 50%), 
          radial-gradient(at 100% 0%, hsla(339,49%,30%,0.05) 0, transparent 50%)
        `
      }}></div>

      {/* Confetti Container */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10 fade-out-confetti">
        {confetti.map((c) => (
          <div
            key={c.id}
            className="absolute -top-5 z-10 animate-[confetti-fall_linear_infinite]"
            style={{
              left: c.left,
              animationDelay: c.animationDelay,
              animationDuration: c.animationDuration,
              backgroundColor: c.backgroundColor,
              width: c.isCircle ? '12px' : '10px',
              height: c.isCircle ? '12px' : '20px',
              borderRadius: c.isCircle ? '50%' : '0',
            }}
          />
        ))}
      </div>

      {/* Main Content Canvas */}
      <main className="relative z-20 w-full max-w-4xl px-6 md:px-8 py-10 flex flex-col items-center animate-in zoom-in-95 duration-500">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-600 mb-3 tracking-tight">Luar Biasa!</h1>
          <p className="text-lg text-gray-500 font-medium">Kamu telah menyelesaikan Modul 1.1: Dasar-dasar Isyarat.</p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-10">

          {/* Center Accuracy Card */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(124,93,250,0.08)] rounded-3xl p-10 flex flex-col items-center justify-center text-center col-span-1 md:col-span-2 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>

            <div className="bg-indigo-100 p-4 rounded-full text-indigo-600 mb-6">
              <Award size={64} strokeWidth={1.5} />
            </div>

            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Rata-rata Akurasi: 92%</h2>
            <p className="text-lg text-gray-500 font-medium">Bagus sekali! Gerakan tanganmu sangat presisi.</p>
          </div>

          {/* Rewards Card 1 */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-3xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Medal size={28} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pengalaman</p>
                <p className="text-2xl font-black text-indigo-600">+50 XP</p>
              </div>
            </div>
          </div>

          {/* Rewards Card 2 */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-3xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                <Flame size={28} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Daily Streak</p>
                <p className="text-2xl font-black text-red-500 flex items-center gap-2">
                  <span>🔥</span> 3 Hari
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-4">
          <button
            onClick={() => {
              if (lessonId) {
                router.push(`/live-practice?lessonId=${lessonId}`);
              } else {
                router.back();
              }
            }}
            className="bg-white/70 backdrop-blur-xl border border-gray-200 shadow-sm rounded-full px-8 py-3.5 font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 focus:outline-none"
          >
            <RefreshCw size={18} />
            Ulangi Pelajaran
          </button>

          <button
            onClick={() => {
              if (nextLessonData && nextLessonData.nextLesson) {
                router.push(`/lessons/${nextLessonData.nextLesson.id}`);
              } else {
                router.push('/lessons');
              }
            }}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 rounded-full px-8 py-3.5 font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-95 focus:outline-none"
          >
            {nextLessonData && nextLessonData.nextLesson ? (
              nextLessonData.isNewModule ? (
                `Lanjut ke ${nextLessonData.nextModule?.title || 'Modul Berikutnya'}`
              ) : (
                `Lanjut ke ${nextLessonData.nextLesson.title}`
              )
            ) : (
              "Kembali ke Kurikulum"
            )}
            <ArrowRight size={18} />
          </button>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes confetti-fall {
            0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .fade-out-confetti {
            animation: fadeOut 1s ease forwards;
            animation-delay: 4s;
        }
        @keyframes fadeOut {
            to { opacity: 0; display: none; }
        }
      `}} />
    </div>
  );
}

export default function ModuleSummaryPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-[100] bg-[#f9f9ff] flex items-center justify-center text-indigo-600 font-bold">Memuat...</div>}>
      <ModuleSummaryContent />
    </Suspense>
  );
}
