"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import ChatWindow from "@/components/chatbot/ChatWindow";
import ChatInput from "@/components/chatbot/ChatInput";
import { Bot, X, MessageSquare, Maximize2, Minimize2, MoreVertical } from "lucide-react";
import { loadModel, predictGesture } from "@/lib/gestureRecognizer";

let msgCounter = 0;
const makeId = () => `msg_${++msgCounter}_${Date.now()}`;

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handsRef = useRef(null);
  const widgetRef = useRef(null);

  // Toggle widget via custom event
  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    const handleOpen = () => setIsOpen(true);
    
    document.addEventListener("toggle-chatbot", handleToggle);
    document.addEventListener("open-chatbot", handleOpen);
    
    return () => {
      document.removeEventListener("toggle-chatbot", handleToggle);
      document.removeEventListener("open-chatbot", handleOpen);
    };
  }, []);

  // Initialize MediaPipe and models on mount
  useEffect(() => {
    loadModel();
    let interval;
    let hands = null;

    const initHands = () => {
      const HandsClass = window.Hands;
      if (!HandsClass) return false;

      hands = new HandsClass({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      handsRef.current = hands;
      return true;
    };

    if (!initHands()) {
      interval = setInterval(() => {
        if (initHands()) {
          clearInterval(interval);
        }
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (hands) hands.close();
    };
  }, []);

  const sendMessage = useCallback(
    async (text) => {
      const userMsg = { id: makeId(), role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      try {
        const history = [...messages, userMsg].map(({ role, content }) => ({
          role,
          content,
        }));

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: history,
          }),
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();
        const replyText =
          data.content
            ?.filter((b) => b.type === "text")
            .map((b) => b.text)
            .join("") ?? "Maaf, terjadi kesalahan.";

        setMessages((prev) => [
          ...prev,
          { id: makeId(), role: "assistant", content: replyText },
        ]);
      } catch (err) {
        console.error("[ChatWidget] Error:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: makeId(),
            role: "assistant",
            content:
              "Maaf, tidak dapat terhubung ke server. Periksa koneksi internetmu.",
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [messages],
  );

  const handleImageUpload = useCallback(async (file) => {
    if (!handsRef.current) return;
    setIsTyping(true);
    
    // Tampilkan pesan bahwa sedang memproses gambar
    const uploadingMsg = { id: makeId(), role: "assistant", content: "Menganalisis gambar..." };
    setMessages((prev) => [...prev, uploadingMsg]);

    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      handsRef.current.onResults((results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0];
          const prediction = predictGesture(landmarks);
          
          if (prediction && prediction.smoothedChar) {
            setMessages((prev) => prev.filter(m => m.id !== uploadingMsg.id));
            const prompt = `[Sistem: Pengguna mengunggah gambar isyarat. Gambar terdeteksi sebagai isyarat huruf ${prediction.smoothedChar} dengan tingkat keyakinan ${Math.round(prediction.confidence)}%. Tolong validasi dan jelaskan formasi jari untuk huruf tersebut kepada pengguna.]`;
            sendMessage(prompt, true);
          } else {
            setMessages((prev) => prev.map(m => m.id === uploadingMsg.id ? { ...m, content: "Maaf, saya tidak bisa mengenali isyarat tersebut. Pastikan tangan terlihat jelas." } : m));
          }
        } else {
           setMessages((prev) => prev.map(m => m.id === uploadingMsg.id ? { ...m, content: "Tidak ada tangan yang terdeteksi di gambar. Tolong unggah foto lain." } : m));
        }
      });

      await handsRef.current.send({ image: img });

    } catch (error) {
      console.error(error);
      setMessages((prev) => prev.map(m => m.id === uploadingMsg.id ? { ...m, content: "Gagal memproses gambar." } : m));
    } finally {
      setIsTyping(false);
    }
  }, [sendMessage]);

  const handleClearChat = useCallback(() => {
    if (confirm("Mulai sesi baru dan hapus percakapan saat ini?")) {
      setMessages([]);
    }
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      
      {/* Jendela Chat */}
      {isOpen && (
        <div 
          ref={widgetRef}
          className={`bg-white rounded-lg shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-gray-200 flex flex-col overflow-hidden mb-4 transition-all duration-300 origin-bottom-right animate-in zoom-in-95 ${
            isExpanded ? 'w-[450px] h-[700px] max-h-[85vh]' : 'w-[360px] h-[550px] max-h-[75vh]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-700 text-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-blue-800 rounded-md flex items-center justify-center">
                  <Bot size={20} className="text-white" />
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-blue-700 rounded-full"></div>
              </div>
              <div>
                <h3 className="font-bold text-sm">AI Bibo</h3>
                <p className="text-xs text-blue-100 font-medium">Membalas dengan cepat ⚡</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
                title={isExpanded ? "Perkecil" : "Perbesar"}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button 
                onClick={() => {
                  if(confirm("Hapus riwayat obrolan?")) setMessages([]);
                }} 
                className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
                title="Hapus riwayat"
              >
                <MoreVertical size={16} />
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1.5 hover:bg-white/20 rounded-md transition-colors ml-1"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Area Pesan */}
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-70">
                <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-md flex items-center justify-center mb-4">
                  <Bot size={32} />
                </div>
                <p className="text-gray-900 font-bold mb-1">Halo! Aku Bibo! ✨</p>
                <p className="text-xs text-gray-500">Kirim gambar isyarat atau tanya sesuatu, saya siap membantu.</p>
              </div>
            ) : (
              <ChatWindow messages={messages} isTyping={isTyping} />
            )}
          </div>

          {/* Area Input */}
          <div className="px-3 py-3 bg-white border-t border-gray-200">
            <ChatInput onSend={(text) => sendMessage(text)} onImageUpload={handleImageUpload} disabled={isTyping} compact={!isExpanded} />
          </div>
        </div>
      )}

      {/* Tombol Floating */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-md flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 focus:outline-none ${
          isOpen ? 'bg-gray-800 text-white shadow-gray-400/30' : 'bg-blue-700 text-white shadow-blue-400/40'
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

    </div>
  );
}
