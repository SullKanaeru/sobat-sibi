// ── components/kamus/SignSelector.jsx ─────────────────────────────────────────
import React from "react";

export default function SignSelector({
  items,
  title,
  subtitle,
  selectedItem,
  onSelectItem,
}) {
  return (
    <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-gray-50 h-full flex flex-col overflow-hidden">
      {/* Header Panel */}
      {/* Tambahkan shrink-0 agar header tidak ikut menyusut saat di-scroll */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h3 className="font-bold text-gray-900 text-sm lg:text-base">
          {title}
        </h3>
        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-md">
          {subtitle}
        </span>
      </div>

      {/* Grid Karakter */}
      {/* PERBAIKAN: Tambahkan `flex-1 min-h-0 content-start` di sini */}
      <div className="grid grid-cols-4 gap-3 lg:gap-4 overflow-y-auto pr-2 pb-4 scrollbar-hide flex-1 min-h-0 content-start">
        {items.map((item) => {
          const isActive = selectedItem === item;

          return (
            <div key={item} className="w-full aspect-square">
              <button
                onClick={() => onSelectItem(item)}
                className={`w-full h-full rounded-2xl flex items-center justify-center text-xl lg:text-2xl font-bold transition-all ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600 shadow-inner border border-indigo-100"
                    : "bg-white text-gray-800 border border-gray-100 hover:bg-gray-50 hover:border-gray-200 shadow-sm"
                }`}
              >
                {item}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
