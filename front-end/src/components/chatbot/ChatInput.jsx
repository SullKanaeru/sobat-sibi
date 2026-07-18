// ── components/chatbot/ChatInput.jsx ───────────────────────────────────────────
import React, { useState } from "react";
import { Send, PlusCircle } from "lucide-react";

export default function ChatInput({ onSend, onImageUpload, disabled }) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text);
      setText("");
    }
  };

  return (
    <div className="mt-2">
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center bg-white border border-gray-300 rounded-md px-2 py-2 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
      >
        <label className="p-2 text-gray-400 hover:text-blue-700 transition-colors cursor-pointer focus:outline-none">
          <input 
            type="file" 
            accept="image/jpeg, image/png, image/webp" 
            className="hidden" 
            onChange={(e) => {
              if (e.target.files?.[0]) {
                onImageUpload?.(e.target.files[0]);
                e.target.value = ''; // reset
              }
            }}
            disabled={disabled}
          />
          <PlusCircle size={24} strokeWidth={1.5} />
        </label>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          placeholder="Ketik pesan baru di sini..."
          className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-700 outline-none placeholder:text-gray-400"
        />

        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className={`p-2 rounded-md flex items-center justify-center transition-all ${
            text.trim() && !disabled
              ? "bg-blue-700 text-white hover:bg-blue-800 shadow-md"
              : "bg-gray-100 text-gray-300 cursor-not-allowed"
          }`}
        >
          <Send size={18} className="translate-x-[-1px] translate-y-[1px]" />
        </button>
      </form>

      <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">
        AI dapat membuat kesalahan. Selalu periksa kembali dengan sumber resmi
        SIBI.
      </p>
    </div>
  );
}
