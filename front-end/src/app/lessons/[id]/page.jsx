"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Brain, Camera, Check, Lock, Play, X } from "lucide-react";
import Image from "next/image";

export default function LessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState(null);
  const [moduleLessons, setModuleLessons] = useState([]);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    async function fetchLesson() {
      try {
        const res = await fetch(`/api/lessons/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setLesson(data.lesson);
          setModuleLessons(data.lesson.module.lessons);
          setCompletedLessonIds(data.completedLessonIds || []);
        } else {
          console.error("Failed to load lesson");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (params.id) {
      fetchLesson();
    }
  }, [params.id]);

  // Reset video playing state when lesson changes
  useEffect(() => {
    setIsVideoPlaying(false);
  }, [lesson?.id]);

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center h-[50vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="w-full flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Pelajaran tidak ditemukan</h2>
        <button onClick={() => router.push('/lessons')} className="text-indigo-600 font-bold hover:underline">
          Kembali ke Kurikulum
        </button>
      </div>
    );
  }

  const title = `Belajar ${lesson.title}`;

  // Split instruction by period to make an ordered list
  const instructionsList = lesson.instruction.split('.').map(s => s.trim()).filter(s => s.length > 0);

  const totalModuleLessons = moduleLessons.length;
  const completedCount = completedLessonIds.length;
  const progressPercent = totalModuleLessons > 0 ? Math.round((completedCount / totalModuleLessons) * 100) : 0;

  const isAlphabet = lesson.title.startsWith("Huruf");
  const signChar = lesson.title.replace("Huruf ", "").replace("Angka ", "").trim();
  const imagePath = isAlphabet ? `/images/dict/huruf/sibi_${signChar.toLowerCase()}.png` : `/images/dict/angka/sibi_${signChar.toLowerCase()}.png`;
  const videoPath = isAlphabet ? `/videos/dict/sibi_${signChar.toLowerCase()}.mp4` : `/videos/dict/sample.mp4`;

  return (
    <div className="w-full flex flex-col lg:flex-row gap-5 pb-6">
      {/* Main Content Area */}
      <div className="flex-1 animate-in fade-in duration-500 min-w-0">
        <div className="mb-4">
          <button
            onClick={() => router.push('/lessons')}
            className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors mb-2 font-bold text-xs focus:outline-none"
          >
            <ArrowLeft size={16} />
            Kembali ke Kurikulum
          </button>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            {title}
          </h2>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Video / Visual Panel */}
          <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-sm rounded-3xl p-5 md:p-6 flex flex-col items-center justify-center min-h-[350px] relative overflow-hidden">
            <div className="absolute inset-0 bg-indigo-50/50 z-0"></div>
            
            {isVideoPlaying ? (
              <div className="relative z-10 w-full h-full bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center animate-in fade-in zoom-in-95 duration-300">
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
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <div className="absolute inset-0 top-4 bottom-28 left-8 right-8 opacity-90 transition-opacity duration-300">
                  <Image
                    src={imagePath}
                    alt={`Ilustrasi ${lesson.title}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain"
                    priority
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-[150px] font-black text-white/50 -z-10 select-none">
                    {signChar}
                  </div>
                </div>
                
                {/* Floating Card Info */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-white/50 flex justify-between items-center transition-all duration-300">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {lesson.title}
                    </h3>
                    <p className="text-gray-600 text-sm font-medium">
                      Perhatikan detail gerakan ini.
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
            )}
          </div>

          {/* Instructions Panel */}
          <div className="flex flex-col gap-4">
            {/* Instruction Card */}
            <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-sm rounded-3xl p-6 flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Instruksi Gerakan</h3>
              <ol className="space-y-2 text-gray-600 text-sm font-medium list-decimal list-inside marker:text-indigo-600 marker:font-bold">
                {instructionsList.map((inst, i) => (
                  <li key={i} className="pl-1">{inst}.</li>
                ))}
              </ol>
            </div>

            {/* AI Tips Card */}
            <div className="bg-indigo-50/80 rounded-3xl p-4 border border-indigo-200 border-dashed flex gap-3 items-start shadow-sm">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Brain size={20} />
              </div>
              <div>
                <h4 className="font-bold text-indigo-700 mb-0.5 text-sm">Tips AI</h4>
                <p className="text-gray-600 text-xs font-medium leading-relaxed">
                  {lesson.is_dynamic
                    ? "Pelajaran ini adalah isyarat bergerak (dinamis). Anda mungkin perlu merekam gerakan selama rentang waktu 1-2 detik di halaman praktik agar AI dapat menangkap urutan perpindahan tangan Anda."
                    : "Pastikan bentuk jari Anda sesuai instruksi. Kamera AI kami akan mendeteksi koordinat jari Anda untuk memvalidasi isyarat statis ini."}
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => router.push(`/live-practice?lessonId=${lesson.id}&title=${encodeURIComponent(lesson.title)}`)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-5 rounded-2xl shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 mt-auto focus:outline-none"
            >
              <Camera size={20} />
              Mulai Praktik dengan Kamera
            </button>
          </div>
        </div>
      </div>

      {/* Module Sidebar (Right side) */}
      <aside className="w-full lg:w-80 shrink-0 mt-4 lg:mt-0">
        <div className="sticky top-20 bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-3xl p-5 shadow-sm overflow-hidden relative">
          {/* Decorative blur */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

          <h3 className="font-extrabold text-gray-900 text-base mb-4 leading-tight relative z-10">
            {lesson.module.title}
          </h3>

          {/* Progress */}
          <div className="mb-4 relative z-10">
            <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 mb-1">
              <span>{progressPercent}% Selesai</span>
              <span>{completedCount}/{totalModuleLessons}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Lesson List */}
          <div className="space-y-1.5 relative z-10 max-h-[300px] overflow-y-auto pr-1">
            {moduleLessons.map((l, index) => {
              const isCompleted = completedLessonIds.includes(l.id);
              const isActive = l.id === lesson.id;
              const isUnlocked = index === 0 || completedLessonIds.includes(moduleLessons[index - 1].id);

              return (
                <button
                  key={l.id}
                  onClick={() => isUnlocked && router.push(`/lessons/${l.id}`)}
                  disabled={!isUnlocked}
                  className={`w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-all text-xs ${
                    !isUnlocked
                      ? 'opacity-50 cursor-not-allowed bg-gray-50/50'
                      : isActive
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : isActive
                        ? 'border-indigo-200 bg-indigo-400'
                        : 'border-gray-200 bg-white'
                  }`}>
                    {isCompleted ? <Check size={10} strokeWidth={4} /> : (!isUnlocked && <Lock size={8} className="text-gray-400" />)}
                  </div>
                  <span className={`font-semibold ${isActive ? 'text-white' : !isUnlocked ? 'text-gray-400' : 'text-gray-700'}`}>
                    {l.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
