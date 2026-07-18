// ── components/chatbot/ChatWindow.jsx ──────────────────────────────────────────
import React, { useEffect, useRef } from "react";
import { Bot, Lightbulb, User } from "lucide-react";

export default function ChatWindow({ messages, isTyping }) {
  const bottomRef = useRef(null);

  // Auto-scroll ke bawah setiap ada pesan baru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Fungsi untuk memisahkan teks biasa dan kotak "Petunjuk"
  const renderMessageContent = (content) => {
    if (content.includes("Petunjuk:")) {
      const parts = content.split("Petunjuk:");
      return (
        <div className="space-y-3">
          <p className="whitespace-pre-wrap">{parts[0].trim()}</p>
          <div className="bg-white rounded-md p-4 flex gap-3 shadow-sm border border-gray-200">
            <div className="text-blue-700 mt-0.5 flex-shrink-0">
              <Lightbulb size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1">Petunjuk</p>
              <p className="text-sm text-gray-700">{parts[1].trim()}</p>
            </div>
          </div>
        </div>
      );
    }
    return <p className="whitespace-pre-wrap">{content}</p>;
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      {/* Pesan Sambutan Default */}
      {messages.length === 0 && (
        <div className="flex justify-start gap-3">
          <div className="w-10 h-10 rounded-md bg-blue-700 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <Bot size={20} />
          </div>
          <div className="bg-white border border-gray-200 text-gray-800 p-4 rounded-md rounded-tl-sm max-w-[80%] text-sm leading-relaxed shadow-sm">
            Halo! Aku Bibo, asisten AI kamu di Sobat SIBI! 🤖✨ Siap untuk berlatih kuis isyarat kata hari
            ini?
          </div>
        </div>
      )}

      {/* Render Pesan */}
      {messages.map((msg) => {
        const isUser = msg.role === "user";

        return (
          <div
            key={msg.id}
            className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
          >
            {/* Avatar AI (Kiri) */}
            {!isUser && (
              <div className="w-10 h-10 rounded-md bg-blue-700 text-white flex items-center justify-center flex-shrink-0 shadow-sm relative mt-auto md:mt-0">
                <Bot size={20} />
              </div>
            )}

            {/* Bubble Chat */}
            <div
              className={`p-4 text-sm leading-relaxed shadow-sm ${
                isUser
                  ? "bg-blue-700 text-white rounded-md rounded-br-sm max-w-[75%]"
                  : "bg-white border border-gray-200 text-gray-800 rounded-md rounded-tl-sm max-w-[80%]"
              }`}
            >
              {isUser ? msg.content : renderMessageContent(msg.content)}
            </div>

            {/* Avatar User (Kanan) */}
            {isUser && (
              <div className="w-10 h-10 rounded-md bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200 shadow-sm mt-auto md:mt-0">
                {/* Ganti dengan <Image /> foto user Anda jika ada */}
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <User size={20} />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Indikator Typing */}
      {isTyping && (
        <div className="flex justify-start gap-3">
          <div className="w-10 h-10 rounded-md bg-blue-700 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <Bot size={20} />
          </div>
          <div className="bg-white border border-gray-200 px-5 py-4 rounded-md rounded-tl-sm flex items-center gap-1 shadow-sm">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
          </div>
        </div>
      )}

      {/* Jangkar untuk auto-scroll */}
      <div ref={bottomRef} />
    </div>
  );
}
