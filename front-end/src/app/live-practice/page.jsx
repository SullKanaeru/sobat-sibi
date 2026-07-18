"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LivePracticeView from "@/components/practice/LivePracticeView";
import GlobalLivePracticeView from "@/components/practice/GlobalLivePracticeView";

function LivePracticeRouter() {
  const searchParams = useSearchParams();
  const lessonId = searchParams.get('lessonId');

  // Jika ada lessonId, berarti dipanggil dari modul (Kurikulum)
  // Gunakan UI overlay purnabingkai (LivePracticeView)
  if (lessonId) {
    return <LivePracticeView />;
  }

  // Jika tidak ada lessonId, berarti dipanggil dari Sidebar Utama (Praktik Bebas)
  // Gunakan UI Bento Grid (GlobalLivePracticeView)
  return <GlobalLivePracticeView />;
}

export default function AITutorPage() {
  return (
    <div className="w-full">
      <Suspense fallback={<div className="p-20 text-center font-bold text-indigo-600">Memuat Kamera Pintar...</div>}>
        <LivePracticeRouter />
      </Suspense>
    </div>
  );
}
