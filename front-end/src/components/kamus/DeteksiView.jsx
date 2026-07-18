// ── components/kamus/DeteksiView.jsx ──────────────────────────────────────────
"use client";

import React, { memo, useEffect, useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { MEDIAPIPE_CDN, EMPTY_RESULT } from "@/constants/kamus";
import {
  loadModel,
  predictGesture,
  resetHistory,
  startRecordingDynamic,
  stopRecordingDynamic,
  getRecordingState,
} from "@/lib/gestureRecognizer";
import { CheckCircle2, ArrowUpRight, Video } from "lucide-react";

// ── Konstanta ──────────────────────────────────────────────────────────────────
const CANVAS_W = 640;
const CANVAS_H = 480;
// Target ~20 FPS untuk deteksi — cukup untuk bahasa isyarat, mengurangi beban WASM 3×
// dibandingkan requestAnimationFrame standar yang berjalan di 60 FPS.
const TARGET_FPS    = 20;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS; // ≈ 50ms
const PREDICT_EVERY_N = 1; // Dengan 20fps, prediksi setiap frame (tidak perlu throttle lagi)
const MIN_CONF_SHOW = 30; // confidence minimum (%) agar char ditampilkan

export default memo(function DeteksiView() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);

  // Ref untuk hal-hal yang tidak perlu trigger re-render
  const frameCountRef = useRef(0);
  const isUnmountedRef = useRef(false);
  const lastResultRef = useRef(EMPTY_RESULT);

  const [modelStatus, setModelStatus] = useState("idle");
  const [result, setResult] = useState(EMPTY_RESULT);
  const [handDetected, setHandDetected] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  // UI State for Recording J/Z
  const [recordingState, _setRecordingState] = useState("idle"); // 'idle' | 'countdown' | 'recording' | 'result'
  const recordingStateRef = useRef("idle");
  const setRecordingState = useCallback((state) => {
    recordingStateRef.current = state;
    _setRecordingState(state);
  }, []);

  const [countdownVal, setCountdownVal] = useState(3);
  const [recordingProgress, setRecordingProgress] = useState(0);

  const handleStartRecording = useCallback(() => {
    if (recordingStateRef.current !== "idle") return;
    setRecordingState("countdown");
    setCountdownVal(3);

    let cnt = 3;
    const interval = setInterval(() => {
      cnt -= 1;
      if (cnt > 0) {
        setCountdownVal(cnt);
      } else {
        clearInterval(interval);
        setRecordingState("recording");
        setRecordingProgress(0);
        
        startRecordingDynamic((dynResult) => {
          setRecordingState("result");
          setResult({
            rawChar: dynResult.char,
            smoothedChar: dynResult.char,
            confidence: dynResult.confidence,
            isConfident: dynResult.confidence >= 70,
          });
          setTimeout(() => {
            setRecordingState("idle");
          }, 4000); // Hold result for 4 seconds
        });
      }
    }, 1000);
  }, [setRecordingState]);

  // ── Update result hanya jika benar-benar berubah ──────────────────────────
  const maybeSetResult = useCallback((next) => {
    const prev = lastResultRef.current;
    if (
      prev.smoothedChar !== next.smoothedChar ||
      Math.abs(prev.confidence - next.confidence) >= 1 // threshold 1% biar tidak flicker
    ) {
      lastResultRef.current = next;
      if (!isUnmountedRef.current) setResult(next);
    }
  }, []);

  // ── Use a ref to store onHandResults so MediaPipe always calls the latest version
  const onHandResultsRef = useRef(null);

  // ── Handler hasil MediaPipe ───────────────────────────────────────────────
  const onHandResults = useCallback(
    (results) => {
      const canvas = canvasRef.current;
      if (!canvas || isUnmountedRef.current) return;

      const ctx = canvas.getContext("2d");
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Mirror context to match mirrored webcam display
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);

      const landmarks = results.multiHandLandmarks?.[0] ?? null;

      if (!isUnmountedRef.current) {
        setDebugInfo(`Hands found: ${results.multiHandLandmarks?.length || 0}`);
      }

      if (landmarks) {
        // Gambar skeleton
        window.drawConnectors?.(ctx, landmarks, window.HAND_CONNECTIONS, {
          color: "#8B5CF6",
          lineWidth: 3,
        });
        window.drawLandmarks?.(ctx, landmarks, {
          color: "#FFFFFF",
          lineWidth: 2,
          radius: 4,
        });

        // Prediksi:
        // - predictGesture() SELALU dipanggil setiap frame, baik saat idle maupun saat recording.
        //   Ini wajib agar frame dinamis terus masuk ke buffer selama rekaman berlangsung.
        // - Update UI result hanya dilakukan saat idle.
        frameCountRef.current += 1;
        if (frameCountRef.current % PREDICT_EVERY_N === 0) {
          const next = predictGesture(landmarks);

          // Hanya perbarui UI jika sedang idle (tidak sedang merekam dinamis)
          if (recordingStateRef.current === "idle") {
            maybeSetResult(next);
          }
        } else if (recordingStateRef.current === "recording") {
          // Saat merekam, tetap jalankan predictGesture di setiap frame
          // agar buffer tidak "bocor" akibat throttle PREDICT_EVERY_N.
          // Ini perbaikan Bug #1 & #2: buffer sebelumnya hanya terisi 1/3 kecepatannya.
          predictGesture(landmarks);
        }

        // Update progress bar dari state buffer aktual
        if (recordingStateRef.current === "recording") {
          const state = getRecordingState();
          setRecordingProgress(Math.round((state.progress / state.total) * 100));
        }

        if (!handDetected) setHandDetected(true);
      } else {
        // Tidak ada tangan
        frameCountRef.current = 0;
        if (handDetected) setHandDetected(false);

        // Batalkan rekaman jika tangan hilang saat merekam
        // agar UI tidak stuck di overlay "Merekam..."
        if (recordingStateRef.current === "recording") {
          stopRecordingDynamic();
          setRecordingState("idle");
          setRecordingProgress(0);
        }

        if (recordingStateRef.current === "idle") {
          maybeSetResult(EMPTY_RESULT);
        }
      }

      ctx.restore();
    },
    [handDetected, maybeSetResult],
  );

  // Keep the ref in sync with the latest callback version
  useEffect(() => {
    onHandResultsRef.current = onHandResults;
  }, [onHandResults]);

  // ── Setup MediaPipe ───────────────────────────────────────────────────────
  const setupMediaPipe = useCallback(async () => {
    if (!webcamRef.current || !canvasRef.current) return;

    const loadScript = (src, globalVarName) =>
      new Promise((resolve, reject) => {
        if (window[globalVarName]) return resolve();
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          const interval = setInterval(() => {
            if (window[globalVarName]) { clearInterval(interval); resolve(); }
          }, 50);
          setTimeout(() => { clearInterval(interval); reject(new Error("Timeout")); }, 15000);
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.crossOrigin = "anonymous";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Gagal load: ${src}`));
        document.head.appendChild(script);
      });

    try {
      setDebugInfo("Memuat drawing_utils...");
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js", "drawConnectors");
      setDebugInfo("Memuat hands.js...");
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js", "Hands");

      await new Promise((r) => setTimeout(r, 300));
      const Hands = window.Hands;
      if (!Hands) throw new Error("MediaPipe Hands tidak tersedia");

      setDebugInfo("Menginisialisasi MediaPipe...");
      const hands = new Hands({
        locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${f}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        // modelComplexity: 0 adalah 'Lite' model — ~50% lebih cepat dari Full (1).
        // Untuk 21 landmark tangan statis, kualitasnya hampir identik.
        // Ini adalah optimasi terbesar untuk perangkat low-end dan VPS.
        modelComplexity: 0,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });

      // Register a stable wrapper that always delegates to the latest callback ref.
      // This prevents landmark freezing caused by MediaPipe holding a stale callback reference.
      hands.onResults((results) => {
        if (onHandResultsRef.current) onHandResultsRef.current(results);
      });

      setDebugInfo("Menunggu model siap...");
      await hands.initialize();
      handsRef.current = hands;

      setDebugInfo("Model siap! Memulai deteksi...");

      // ── Frame Loop dengan 20 FPS Cap ──────────────────────────────────────
      // Menggunakan timestamp gating daripada requestAnimationFrame murni (60fps).
      // 20 FPS cukup untuk menangkap isyarat tangan; memberikan 3× ruang napas
      // untuk WASM MediaPipe dan TensorFlow.js agar tidak berkompetisi di tiap frame.
      let isSending = false;
      let lastSendTime = 0;
      const processFrame = async (now) => {
        // Always reschedule FIRST so the loop never dies
        if (!isUnmountedRef.current) {
          cameraRef.current = requestAnimationFrame(processFrame);
        }

        // FPS gate: skip frame jika interval belum tercapai
        if (now - lastSendTime < FRAME_INTERVAL_MS) return;

        if (isUnmountedRef.current || !webcamRef.current?.video || isSending || !handsRef.current) {
          return;
        }

        const video = webcamRef.current.video;
        if (video.paused || video.ended || video.readyState < 2) return;

        lastSendTime = now;
        isSending = true;
        try {
          await handsRef.current.send({ image: video });
        } catch (e) {
          console.error("[DeteksiView] send error:", e);
        } finally {
          isSending = false;
        }
      };

      processFrame();

    } catch (err) {
      console.error("[DeteksiView] Setup MediaPipe gagal:", err);
      throw err;
    }
  }, [onHandResults]);

  // ── Mount / Unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    isUnmountedRef.current = false;
    setModelStatus("loading");

    (async () => {
      try {
        await loadModel();
        if (!isMounted) return;
        setModelStatus("ready");
        
        // Prevent React StrictMode double initialization race condition
        if (!window.isMediaPipeInitializing) {
          window.isMediaPipeInitializing = true;
          try {
            if (isMounted) await setupMediaPipe();
          } finally {
            window.isMediaPipeInitializing = false;
          }
        } else {
          setTimeout(() => { 
            if (isMounted) {
              setupMediaPipe().catch(err => {
                console.error("[DeteksiView] Retry Init gagal:", err);
                if (isMounted) setModelStatus("error");
              });
            }
          }, 1000);
        }
      } catch (err) {
        console.error("[DeteksiView] Init gagal:", err);
        if (isMounted) setModelStatus("error");
      }
    })();

    return () => {
      isMounted = false;
      isUnmountedRef.current = true;

      if (cameraRef.current) {
        cancelAnimationFrame(cameraRef.current);
        cameraRef.current = null;
      }

      // Delay close to let pending WASM sends finish
      setTimeout(() => {
        if (handsRef.current) {
          try { handsRef.current.close(); } catch (e) {}
          handsRef.current = null;
        }
      }, 500);

      resetHistory();
      frameCountRef.current = 0;
      lastResultRef.current = EMPTY_RESULT;
    };
  }, [setupMediaPipe]);

  // ── Derived UI (tidak ada kalkulasi berat di sini) ────────────────────────
  const conf = Math.round(result.confidence);
  const displayChar =
    conf >= MIN_CONF_SHOW
      ? result.smoothedChar === "..."
        ? ""
        : result.smoothedChar
      : "";
  const isPerfect = conf >= 90;

  const confBarColor =
    conf >= 80 ? "bg-indigo-500" : conf >= 50 ? "bg-indigo-300" : "bg-gray-200";

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
          Praktik Langsung
        </h2>
        <p className="text-gray-500 mt-1">
          Tutor AI sedang menganalisis gerakan Anda secara seketika.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* KIRI: Kamera */}
        <div className="lg:col-span-8 bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 flex flex-col">
          {/* Status badge */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2 bg-indigo-50/50 px-3 py-1.5 rounded-full">
              <div
                className={`w-2 h-2 rounded-full ${
                  modelStatus === "ready"
                    ? "bg-red-500 animate-pulse"
                    : "bg-gray-400"
                }`}
              />
              <span className="text-indigo-700 text-xs font-bold tracking-wide">
                {modelStatus === "ready"
                  ? handDetected
                    ? "Tangan Terdeteksi"
                    : "Kamera Aktif"
                  : modelStatus === "loading"
                    ? "Memulai..."
                    : "Kesalahan"}
              </span>
            </div>
          </div>
          
          <div className="mb-2 text-xs font-mono text-gray-500 bg-gray-100 p-2 rounded-md">
            DEBUG: {debugInfo || "Menunggu proses..."}
          </div>

          {/* Video area */}
          <div className="relative w-full flex-1 aspect-[4/3] bg-gray-50 rounded-2xl overflow-hidden shadow-inner">
            <Webcam
              ref={webcamRef}
              audio={false}
              mirrored={true}
              videoConstraints={{
                facingMode: "user",
                // Minta browser memberikan stream 320×240 ke MediaPipe.
                // Ini mengurangi data yang diproses WASM sebesar 4× (dari 640×480).
                // Display di layar tetap full-size karena CSS object-cover mengatur ini.
                width: { ideal: 320 },
                height: { ideal: 240 },
              }}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover"
              width={CANVAS_W}
              height={CANVAS_H}
            />

            {/* Focus overlay */}
            {modelStatus === "ready" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className={`w-[60%] h-[70%] border-2 rounded-2xl transition-colors duration-300 ${
                    handDetected
                      ? "border-indigo-500/70"
                      : "border-indigo-300/40"
                  }`}
                >
                  {["tl", "tr", "bl", "br"].map((pos) => (
                    <div
                      key={pos}
                      className={`absolute w-8 h-8 border-4 border-indigo-600
                      ${pos === "tl" ? "top-0 left-0 border-r-0 border-b-0 rounded-tl-2xl" : ""}
                      ${pos === "tr" ? "top-0 right-0 border-l-0 border-b-0 rounded-tr-2xl" : ""}
                      ${pos === "bl" ? "bottom-0 left-0 border-r-0 border-t-0 rounded-bl-2xl" : ""}
                      ${pos === "br" ? "bottom-0 right-0 border-l-0 border-t-0 rounded-br-2xl" : ""}
                    `}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recording Overlay */}
            {recordingState !== "idle" && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl">
                {recordingState === "countdown" && (
                  <div className="flex flex-col items-center animate-in zoom-in duration-300">
                    <span className="text-8xl font-black text-white drop-shadow-lg">{countdownVal}</span>
                    <span className="text-white/90 text-lg font-medium mt-2">Bersiap...</span>
                  </div>
                )}
                {recordingState === "recording" && (
                  <div className="flex flex-col items-center w-full max-w-xs animate-in fade-in">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse mb-6">
                      <div className="w-8 h-8 rounded-full bg-red-500" />
                    </div>
                    <h3 className="text-white font-bold text-xl mb-4">Merekam Gerakan...</h3>
                    <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 transition-all duration-75"
                        style={{ width: `${recordingProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                {recordingState === "result" && (
                  <div className="flex flex-col items-center animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold text-2xl shadow-xl flex items-center gap-3">
                      <CheckCircle2 size={28} />
                      Deteksi Selesai
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Loading overlay */}
            {modelStatus === "loading" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm gap-3 z-10">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="font-bold text-indigo-600">
                  Menyiapkan AI & Kamera...
                </p>
              </div>
            )}

            {/* Error overlay */}
            {modelStatus === "error" && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
                <p className="font-bold text-red-500 text-center px-6">
                  Gagal memuat. Pastikan izin kamera aktif lalu refresh halaman.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* KANAN: Panel hasil */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Card 1: Karakter */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-50 flex flex-col items-center justify-center relative overflow-hidden min-h-[220px]">
            <div className="absolute right-[-20%] top-[-20%] w-64 h-64 bg-indigo-50 rounded-full mix-blend-multiply opacity-70" />
            <h3
              className={`text-[120px] font-black leading-none relative z-10 drop-shadow-sm transition-all duration-200 ${
                displayChar
                  ? "text-indigo-600 scale-100"
                  : "text-gray-200 scale-95"
              }`}
            >
              {displayChar || "-"}
            </h3>
            <div
              className={`mt-2 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold relative z-10 transition-all duration-300 ${
                isPerfect
                  ? "bg-indigo-50 text-indigo-600 opacity-100"
                  : "opacity-0"
              }`}
            >
              <CheckCircle2 size={16} />
              <span>Sangat cocok</span>
            </div>
          </div>

          {/* Card 2: Confidence */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50">
            <div className="flex justify-between items-end mb-4">
              <h4 className="font-bold text-gray-700">Tingkat Akurasi</h4>
              <span className="text-3xl font-black text-indigo-600">
                {conf > 0 ? `${conf}%` : "--%"}
              </span>
            </div>
            <div className="w-full bg-indigo-50 rounded-full h-3.5 mb-6 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ease-out ${confBarColor}`}
                style={{ width: `${conf}%` }}
              />
            </div>
            
            {/* Record J/Z Button */}
            <button 
              onClick={handleStartRecording}
              disabled={recordingState !== "idle"}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all ${
                recordingState !== "idle"
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:scale-[0.98]"
              }`}
            >
              <Video size={20} />
              Rekam Gerakan (J/Z)
            </button>
          </div>

          {/* Card 3: Reference Pattern */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 flex-1">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-gray-700 text-sm">
                Pola Referensi
              </h4>
              <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                <ArrowUpRight size={20} />
              </button>
            </div>
            <div className="w-full h-32 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
              {displayChar ? (
                // Tampilkan gambar referensi berdasarkan huruf yang terdeteksi
                // Ganti src dengan path gambar referensi kamu
                <p className="text-5xl font-black text-indigo-100 select-none">
                  {displayChar}
                </p>
              ) : (
                <p className="text-xs font-medium text-gray-400 px-4 text-center">
                  Contoh pergerakan akan muncul di sini.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
