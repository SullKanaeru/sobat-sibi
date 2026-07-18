// ── app/kamus/page.jsx ─────────────────────────────────────────────────────────
"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";

// Gunakan komponen reusable yang baru
import SignSelector from "@/components/kamus/SignSelector";
import SignDetail from "@/components/kamus/SignDetail";

// Data Generator
const ALPHABET = Array.from({ length: 26 }, (_, i) =>
  String.fromCharCode(65 + i),
);
const NUMBERS = Array.from({ length: 10 }, (_, i) => i.toString()); // ["0", "1", ..., "9"]

const GlobalLivePracticeView = dynamic(() => import("@/components/practice/GlobalLivePracticeView"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-[60vh] text-blue-700 gap-4">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
      <p className="font-bold">Memuat Kamera Pintar...</p>
    </div>
  ),
});

export default function KamusPage() {
  const [activeTab, setActiveTab] = useState("Alphabet");

  // Pisahkan state untuk huruf dan angka agar ingat pilihan terakhir user
  const [selectedLetter, setSelectedLetter] = useState("A");
  const [selectedNumber, setSelectedNumber] = useState("1");

  const [isPracticing, setIsPracticing] = useState(false);

  const TABS = ["Alphabet", "Numbers", "Phrases"];

  const handlePractice = useCallback(() => setIsPracticing(true), []);
  const handleBackToKamus = useCallback(() => setIsPracticing(false), []);

  return (
    <div className="w-full h-full min-h-[calc(100vh-120px)] animate-in fade-in duration-500">
      {isPracticing ? (
        <div className="space-y-6">
          <button
            onClick={handleBackToKamus}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-700 transition-colors font-semibold bg-white px-4 py-2 rounded-md w-fit shadow-sm border border-gray-200"
          >
            <ArrowLeft size={18} />
            Kembali ke Kamus
          </button>
          <div className="w-full">
            <GlobalLivePracticeView />
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between md:items-end mb-6 gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                Kamus SIBI
              </h1>
              <p className="text-gray-500 mt-1 text-xs md:text-sm">
                Kuasai karakter Bahasa Isyarat Indonesia dengan visualisasi yang jelas.
              </p>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 w-fit">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2.5 rounded-md text-sm font-semibold transition-all ${activeTab === tab
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                    }`}
                >
                  {tab === "Alphabet"
                    ? "Huruf"
                    : tab === "Numbers"
                      ? "Angka"
                      : "Frasa"}
                </button>
              ))}
            </div>
          </div>

          {/* TAB: ALPHABET */}
          {activeTab === "Alphabet" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[520px]">
              <div className="lg:col-span-7 h-full min-h-0">
                <SignDetail item={selectedLetter} type="Alphabet" onPractice={handlePractice} />
              </div>
              <div className="lg:col-span-5 h-full min-h-0">
                <SignSelector
                  items={ALPHABET}
                  title="Pilih Huruf"
                  subtitle="26 Karakter"
                  selectedItem={selectedLetter}
                  onSelectItem={setSelectedLetter}
                />
              </div>
            </div>
          )}

          {/* TAB: NUMBERS (Angka) */}
          {activeTab === "Numbers" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[520px] animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="lg:col-span-7 h-full min-h-0">
                <SignDetail item={selectedNumber} type="Numbers" onPractice={handlePractice} />
              </div>
              <div className="lg:col-span-5 h-full min-h-0">
                <SignSelector
                  items={NUMBERS}
                  title="Pilih Angka"
                  subtitle="10 Karakter"
                  selectedItem={selectedNumber}
                  onSelectItem={setSelectedNumber}
                />
              </div>
            </div>
          )}

          {/* TAB: PHRASES (Frasa) */}
          {activeTab === "Phrases" && (
            <div className="w-full h-[50vh] bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-4">
              <div className="text-6xl">🚧</div>
              <p className="font-bold text-lg text-gray-600">
                Fitur "Frasa" sedang dalam pengembangan.
              </p>
              <button
                onClick={() => setActiveTab("Alphabet")}
                className="mt-2 text-blue-700 font-semibold hover:underline"
              >
                Kembali ke Huruf
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
