"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  BookOpen, 
  Clock, 
  ChevronDown, 
  PlayCircle, 
  Lock, 
  Hand, 
  MessageSquare,
  CheckCircle2
} from "lucide-react";

export default function LessonsPage() {
  const [openAccordion, setOpenAccordion] = useState(null);
  const [levels, setLevels] = useState([]);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchLessons() {
      try {
        const res = await fetch("/api/lessons");
        if (res.ok) {
          const data = await res.json();
          setLevels(data.levels || []);
          setCompletedLessons(data.completedLessonIds || []);
          // Secara default tertutup, pengguna harus mengeklik untuk membuka
        }
      } catch (error) {
        console.error("Error fetching lessons:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLessons();
  }, []);

  const toggleAccordion = (id) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const getLevelIcon = (index) => {
    if (index === 0) return <BookOpen size={32} />;
    if (index === 1) return <Hand size={32} />;
    return <MessageSquare size={32} />;
  };

  // Pre-calculate module statuses
  const moduleStatus = {};
  let previousModuleCompleted = true; // First module is always unlocked

  levels.forEach(level => {
    level.modules.forEach(mod => {
      const totalLessons = mod.lessons.length;
      const completedCount = mod.lessons.filter(l => completedLessons.includes(l.id)).length;
      const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
      const isCompleted = totalLessons > 0 && completedCount === totalLessons;
      
      moduleStatus[mod.id] = {
        unlocked: previousModuleCompleted,
        progress,
        isCompleted,
        completedCount,
        totalLessons
      };
      
      previousModuleCompleted = isCompleted;
    });
  });

  return (
    <div className="w-full animate-in fade-in duration-500 pb-12">
      {/* Header Section */}
      <header className="mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight mb-1">
          Kurikulum Pembelajaran
        </h2>
        <p className="text-sm md:text-base text-gray-500 max-w-2xl">
          Pilih level yang ingin kamu kuasai. Mulai dari dasar hingga mahir dalam menggunakan bahasa isyarat.
        </p>
      </header>

      {/* Curriculum Grid */}
      <div className="grid grid-cols-1 gap-4 max-w-5xl">
        
        {loading ? (
          <div className="flex justify-center p-10">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          levels.map((level, index) => {
            const isOpen = openAccordion === level.id;
            
            // Level is unlocked if its first module is unlocked
            const isUnlocked = level.modules.length > 0 && moduleStatus[level.modules[0].id].unlocked;
            
            // Calculate Level Progress
            const levelTotalLessons = level.modules.reduce((acc, mod) => acc + mod.lessons.length, 0);
            const levelCompletedLessons = level.modules.reduce((acc, mod) => acc + mod.lessons.filter(l => completedLessons.includes(l.id)).length, 0);
            const levelProgress = levelTotalLessons > 0 ? Math.round((levelCompletedLessons / levelTotalLessons) * 100) : 0;
            const isLevelCompleted = levelTotalLessons > 0 && levelCompletedLessons === levelTotalLessons;
            
            return (
              <article 
                key={level.id}
                className={`border rounded-lg relative overflow-hidden transition-all duration-300 ${
                  isUnlocked 
                    ? 'bg-white border-gray-200 shadow-sm hover:shadow-md' 
                    : 'bg-gray-50 border-gray-200 opacity-80'
                }`}
              >
                
                <div 
                  className={`p-5 md:p-7 relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4 ${isUnlocked ? 'cursor-pointer' : ''}`}
                  onClick={() => isUnlocked && toggleAccordion(level.id)}
                >
                  <div className="flex gap-4 items-start">
                    {/* Icon/Badge */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                      isUnlocked 
                        ? 'bg-blue-50 text-blue-700 shadow-sm' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {getLevelIcon(index)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                          isUnlocked ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                        }`}>
                          Level {level.level_order}
                        </span>
                        <span className={`text-xs font-bold px-3 py-1 rounded flex items-center gap-1.5 ${
                          isUnlocked ? 'bg-blue-50 text-blue-700' : 'text-gray-400'
                        }`}>
                          {isUnlocked ? (
                            isLevelCompleted ? (
                              <>
                                <CheckCircle2 size={14} className="text-green-600" /> <span className="text-green-700">Selesai</span>
                              </>
                            ) : (
                              <>
                                <Clock size={14} /> Tersedia
                              </>
                            )
                          ) : (
                            <>
                              <Lock size={14} /> Terkunci
                            </>
                          )}
                        </span>
                      </div>
                      <h3 className={`text-xl font-bold mb-1 ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                        {level.title}
                      </h3>
                      <p className={`text-sm max-w-xl ${isUnlocked ? 'text-gray-500' : 'text-gray-400'}`}>
                        {level.description}
                      </p>
                    </div>
                  </div>

                  {/* Progress Circular */}
                  {isUnlocked && (
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-gray-900">Progres</p>
                        <p className="text-xs text-gray-500 font-medium">{levelCompletedLessons}/{levelTotalLessons} Selesai</p>
                      </div>
                      <div className="relative w-16 h-16">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path className="text-gray-100 stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3"></path>
                          <path className="text-blue-700 stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray={`${levelProgress}, 100`} strokeLinecap="round" strokeWidth="3"></path>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-blue-700">
                          {levelProgress}%
                        </div>
                      </div>
                      <ChevronDown 
                        className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
                        size={24} 
                      />
                    </div>
                  )}
                </div>

                {/* Accordion Content (Modules) */}
                {isUnlocked && (
                  <div 
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <div className="px-5 md:px-7 pb-5 md:pb-7 pt-0 border-t border-gray-100 mt-1">
                      <div className="space-y-2 mt-4">
                        
                        {level.modules.map((mod) => {
                          const mStatus = moduleStatus[mod.id];
                          const modUnlocked = mStatus.unlocked;
                          
                          if (!modUnlocked) {
                            return (
                              <div key={mod.id} className="bg-gray-50 border border-gray-200 rounded-md p-4 flex items-center justify-between opacity-70">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-md bg-gray-200 text-gray-500 flex items-center justify-center">
                                    <Lock size={16} />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-500 text-sm">{mod.title}</h4>
                                    <p className="text-gray-400 text-xs font-medium mt-0.5">
                                      {mod.lessons.length} Pelajaran • Selesaikan modul sebelumnya
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div 
                              key={mod.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (mod.lessons.length > 0) {
                                  const nextPendingLesson = mod.lessons.find(l => !completedLessons.includes(l.id));
                                  if (nextPendingLesson) {
                                    router.push(`/lessons/${nextPendingLesson.id}`);
                                  } else {
                                    router.push(`/lessons/${mod.lessons[0].id}`);
                                  }
                                }
                              }}
                              className="bg-white border border-gray-200 rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between hover:shadow-sm hover:border-gray-300 transition-all cursor-pointer group gap-3 md:gap-0"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center">
                                  {mStatus.isCompleted ? <CheckCircle2 size={20} className="text-green-500" /> : <PlayCircle size={20} />}
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-900 text-sm group-hover:text-blue-700 transition-colors">
                                    {mod.title}
                                  </h4>
                                  <p className="text-gray-500 text-xs font-medium mt-0.5">
                                    {mod.lessons.length} Pelajaran • {mod.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between md:justify-end gap-6 ml-16 md:ml-0">
                                {/* Bar persentase mini */}
                                <div className="w-24 md:w-32 flex flex-col gap-1">
                                  <div className="flex justify-between text-xs font-bold text-gray-400">
                                    <span>Progres</span>
                                    <span>{mStatus.progress}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${mStatus.isCompleted ? 'bg-green-500' : 'bg-blue-700'}`} style={{ width: `${mStatus.progress}%` }}></div>
                                  </div>
                                </div>
                                <button className="text-blue-700 font-bold text-sm px-5 py-2.5 bg-blue-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  {mStatus.isCompleted ? 'Ulangi' : 'Lanjut'}
                                </button>
                              </div>
                            </div>
                          );
                        })}

                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}

      </div>
    </div>
  );
}
