// ── components/chatbot/ChatSidebar.jsx ─────────────────────────────────────────
import React from "react";
import { History, Plus } from "lucide-react";

export default function ChatSidebar({ onNewSession }) {
  const historyData = [
    { id: 1, title: "Latihan Kata Dasar", time: "Hari ini, 10:30 AM" },
    { id: 2, title: "Review Huruf A-M", time: "Kemarin" },
    { id: 3, title: "Sesi Tanya Jawab Bebas", time: "2 Hari yang lalu" },
  ];

  return (
    <div className="bg-[#FAF9FF]/80 rounded-[2rem] p-6 border border-gray-100 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <History size={20} className="text-indigo-600" />
        <h3 className="font-bold text-gray-900">Riwayat Belajar</h3>
      </div>

      {/* List Riwayat */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-2">
        {historyData.map((item, idx) => (
          <div
            key={item.id}
            className={`p-4 rounded-2xl cursor-pointer transition-all ${
              idx === 0
                ? "bg-gray-100 border-transparent shadow-sm"
                : "bg-white border border-gray-100 hover:border-indigo-200"
            }`}
          >
            <h4 className="text-sm font-bold text-gray-800 mb-1">
              {item.title}
            </h4>
            <p className="text-xs text-gray-500">{item.time}</p>
          </div>
        ))}
      </div>

      {/* Tombol Sesi Baru */}
      <div className="pt-4 mt-auto">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-indigo-400 text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors focus:outline-none"
        >
          <Plus size={18} />
          Sesi Baru
        </button>
      </div>
    </div>
  );
}
