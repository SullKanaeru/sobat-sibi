"use client";

import React, { memo, useEffect, useRef, useState, useCallback, Suspense } from "react";
import Webcam from "react-webcam";
import { useRouter, useSearchParams } from "next/navigation";
import { EMPTY_RESULT } from "@/constants/kamus";
import {
  loadModel,
  predictGesture,
  resetHistory,
  startRecordingDynamic,
  addDynamicFrame,
  getRecordingState,
} from "@/lib/gestureRecognizer";
import { ArrowLeft, Timer, Camera, CheckCircle2, Video, AlertTriangle } from "lucide-react";

const CANVAS_W = 320;
const CANVAS_H = 240;
const TARGET_FPS = 24;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;
const PREDICT_EVERY_N = 1;
const MIN_CONF_SHOW = 30;

// Letters that require dynamic (motion-based) gesture detection
const DYNAMIC_LETTERS = ["J", "Z"];

function LivePracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonId = searchParams.get('lessonId');
  const lessonTitle = searchParams.get('title') || "Latihan";
  
  // Extract the target letter from lesson title (e.g. "Huruf J" → "J", "Angka 5" → "5")
  const targetLetter = lessonTitle.replace("Huruf ", "").replace("Angka ", "").trim().toUpperCase();
  const isDynamicLesson = DYNAMIC_LETTERS.includes(targetLetter);

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const onHandResultsRef = useRef(null);

  const frameCountRef = useRef(0);
  const isUnmountedRef = useRef(false);
  const lastResultRef = useRef(EMPTY_RESULT);

  const [modelStatus, setModelStatus] = useState("idle");
  const [result, setResult] = useState(EMPTY_RESULT);
  const [handDetected, setHandDetected] = useState(false);
  const [timer, setTimer] = useState(45); // 45 seconds timer
  const [holdProgress, setHoldProgress] = useState(0);
  const holdStartTimeRef = useRef(null);

  // Dynamic gesture states (for J/Z lessons)
  const [dynamicResult, setDynamicResult] = useState(null);
  const [recordingState, setRecordingState] = useState({ isRecording: false, progress: 0, total: 60, remainingMs: 0 });
  const [recordingError, setRecordingError] = useState(null);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const timeoutId = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [timer]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStartRecording = useCallback(() => {
    setDynamicResult(null);
    setRecordingError(null);

    startRecordingDynamic((res) => {
      if (res.error === "timeout") {
        setRecordingError("Rekaman gagal: tangan tidak terdeteksi cukup lama. Coba lagi.");
        setRecordingState({ isRecording: false, progress: 0, total: 60, remainingMs: 0 });
        setTimeout(() => setRecordingError(null), 4000);
      } else {
        setDynamicResult(res);
        setRecordingState({ isRecording: false, progress: 0, total: 60, remainingMs: 0 });

        // If the detected letter matches the target, auto-complete the lesson
        if (res.char === targetLetter && res.confidence >= 60) {
          setTimeout(() => {
            if (lessonId) {
              fetch(`/api/lessons/${lessonId}/complete`, { method: "POST" })
                .catch(err => console.error("Error saving progress:", err))
                .finally(() => {
                  router.push(`/live-practice/summary?lessonId=${lessonId}&accuracy=${Math.round(res.confidence)}&letter=${res.char}`);
                });
            } else {
              router.push(`/live-practice/summary?accuracy=${Math.round(res.confidence)}&letter=${res.char}`);
            }
          }, 1500);
        } else {
          setTimeout(() => setDynamicResult(null), 5000);
        }
      }
    });

    setRecordingState({ isRecording: true, progress: 0, total: 60, remainingMs: 5000 });
  }, [targetLetter, lessonId, router]);

  const maybeSetResult = useCallback((next) => {
    const prev = lastResultRef.current;
    if (
      prev.smoothedChar !== next.smoothedChar ||
      Math.abs(prev.confidence - next.confidence) >= 1
    ) {
      lastResultRef.current = next;
      if (!isUnmountedRef.current) setResult(next);
    }
  }, []);

  const onHandResults = useCallback(
    (results) => {
      const canvas = canvasRef.current;
      if (!canvas || isUnmountedRef.current) return;

      const ctx = canvas.getContext("2d");
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Mirror the canvas context to match the mirrored webcam display
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);

      const landmarks = results.multiHandLandmarks?.[0] ?? null;

      if (landmarks) {
        window.drawConnectors?.(ctx, landmarks, window.HAND_CONNECTIONS, {
          color: "#4ade80",
          lineWidth: 3,
        });
        window.drawLandmarks?.(ctx, landmarks, {
          color: "#FFFFFF",
          lineWidth: 2,
          radius: 4,
        });

        frameCountRef.current += 1;
        if (frameCountRef.current % PREDICT_EVERY_N === 0) {
          const next = predictGesture(landmarks);
          maybeSetResult(next);

          // Logic Tahan Posisi 2 Detik (Static Gestures only, not for J/Z)
          if (!isDynamicLesson && next.confidence >= 90) {
            if (!holdStartTimeRef.current) {
              holdStartTimeRef.current = Date.now();
            } else {
              const elapsed = Date.now() - holdStartTimeRef.current;
              const progress = Math.min((elapsed / 2000) * 100, 100);
              setHoldProgress(progress);
              
              if (progress >= 100) {
                if (lessonId) {
                  fetch(`/api/lessons/${lessonId}/complete`, { method: "POST" })
                    .catch(err => console.error("Error saving progress:", err))
                    .finally(() => {
                      router.push(`/live-practice/summary?lessonId=${lessonId}&accuracy=${Math.round(next.confidence)}&letter=${next.smoothedChar}`);
                    });
                } else {
                  router.push(`/live-practice/summary?accuracy=${Math.round(next.confidence)}&letter=${next.smoothedChar}`);
                }
              }
            }
          } else if (!isDynamicLesson) {
            holdStartTimeRef.current = null;
            setHoldProgress(0);
          }
        }

        if (!handDetected) setHandDetected(true);
      } else {
        frameCountRef.current = 0;
        holdStartTimeRef.current = null;
        setHoldProgress(0);
        if (handDetected) setHandDetected(false);
        maybeSetResult(EMPTY_RESULT);

        // If recording dynamic and hand is lost, pad with last known frame
        const state = getRecordingState();
        if (state.isRecording) {
          addDynamicFrame(null);
        }
      }

      // Sync recording UI state
      if (isDynamicLesson) {
        const currentState = getRecordingState();
        if (currentState.isRecording || recordingState.isRecording) {
          setRecordingState(currentState);
        }
      }

      ctx.restore();
    },
    [handDetected, maybeSetResult, lessonId, router, isDynamicLesson, recordingState.isRecording]
  );

  // Keep the ref in sync with the latest callback
  useEffect(() => {
    onHandResultsRef.current = onHandResults;
  }, [onHandResults]);

  const setupMediaPipe = useCallback(async () => {
    if (!webcamRef.current || !canvasRef.current) return;

    const loadScript = (src, globalVarName) =>
      new Promise((resolve, reject) => {
        if (window[globalVarName]) return resolve();
        
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          const interval = setInterval(() => {
            if (window[globalVarName]) {
              clearInterval(interval);
              resolve();
            }
          }, 50);
          setTimeout(() => { clearInterval(interval); reject(new Error("Timeout")); }, 10000);
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
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js", "drawConnectors");
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js", "Hands");

      await new Promise((r) => setTimeout(r, 300));
      const Hands = window.Hands;
      if (!Hands) throw new Error("MediaPipe Hands tidak tersedia");

      const hands = new Hands({
        locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${f}`,
      });
      
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0, // Lite model: ~50% lebih cepat, akurasi landmark hampir sama
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });
      // Register a stable wrapper that always delegates to the latest callback ref.
      hands.onResults((results) => {
        if (onHandResultsRef.current) onHandResultsRef.current(results);
      });
      await hands.initialize();
      handsRef.current = hands;

      let isSending = false;
      let lastSendTime = 0;
      const processFrame = async (now) => {
        if (isUnmountedRef.current || !webcamRef.current || !webcamRef.current.video) {
          return;
        }

        // FPS gate
        if (now - lastSendTime < FRAME_INTERVAL_MS) {
          cameraRef.current = requestAnimationFrame(processFrame);
          return;
        }

        const video = webcamRef.current.video;
        if (!video.paused && !video.ended && video.readyState >= 2 && !isSending && handsRef.current) {
          lastSendTime = now;
          isSending = true;
          try {
            if (!isUnmountedRef.current) {
              await handsRef.current.send({ image: video });
            }
          } catch (e) {
            console.error(e);
          } finally {
            isSending = false;
          }
        }
        if (!isUnmountedRef.current) {
          cameraRef.current = requestAnimationFrame(processFrame);
        }
      };
      
      processFrame();

    } catch (err) {
      console.error("[LivePracticeView] Setup MediaPipe gagal:", err);
      throw err;
    }
  }, [onHandResults]);

  useEffect(() => {
    let isMounted = true;
    isUnmountedRef.current = false;
    setModelStatus("loading");

    (async () => {
      try {
        await loadModel();
        if (!isMounted) return;
        setModelStatus("ready");
        
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
                if (isMounted) setModelStatus("error");
              });
            }
          }, 1000);
        }
      } catch (err) {
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

      // Delay closing to let pending WASM sends finish
      setTimeout(() => {
        if (handsRef.current) {
          try {
            handsRef.current.close();
          } catch (e) { }
          handsRef.current = null;
        }
      }, 500);

      resetHistory();
      frameCountRef.current = 0;
      lastResultRef.current = EMPTY_RESULT;
    };
  }, [setupMediaPipe]);

  const conf = dynamicResult ? Math.round(dynamicResult.confidence) : Math.round(result.confidence);
  const displayChar = dynamicResult
    ? dynamicResult.char
    : (conf >= MIN_CONF_SHOW && result.smoothedChar !== "..." ? result.smoothedChar : "");
  const isPerfect = isDynamicLesson
    ? (dynamicResult && dynamicResult.char === targetLetter && dynamicResult.confidence >= 60)
    : conf >= 90;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col h-screen overflow-hidden text-gray-900 bg-[#f9f9ff]">
      {/* Background radial gradient equivalent to the mesh-bg */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: `
            radial-gradient(at 0% 0%, hsla(253,16%,7%,0.05) 0, transparent 50%), 
            radial-gradient(at 50% 0%, hsla(225,39%,30%,0.05) 0, transparent 50%), 
            radial-gradient(at 100% 0%, hsla(339,49%,30%,0.05) 0, transparent 50%)
          `
        }}
      />

      {/* Top Navigation Area */}
      <header className="w-full px-6 py-4 flex justify-between items-center z-50 fixed top-0 left-0 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-md bg-white border border-gray-200 shadow-sm flex items-center justify-center text-blue-700 hover:bg-gray-50 transition-colors focus:outline-none"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="bg-white border border-gray-200 shadow-sm px-5 py-2.5 rounded-md flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-500">Latihan:</span>
            <span className="text-xl font-bold text-blue-700">{lessonTitle}</span>
            {isDynamicLesson && (
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded-full">Dinamis</span>
            )}
          </div>
        </div>
        <div className="bg-white border border-gray-200 shadow-sm px-4 py-2.5 rounded-md flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Timer size={18} className="text-gray-500" />
            <span className="font-bold text-sm text-gray-900">{formatTime(timer)}</span>
          </div>
          <div className="w-8 h-8 rounded-full border-2 border-blue-200 flex items-center justify-center relative">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-gray-200 stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3"></path>
              <path className="text-blue-700 stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray={`${(timer/45)*100}, 100`} strokeWidth="3"></path>
            </svg>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow pt-[80px] pb-6 px-4 lg:px-6 flex flex-col h-full relative z-10 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full min-h-[380px]">
          
          <div className="bg-white border border-gray-200 shadow-sm rounded-lg flex flex-col items-center justify-center relative overflow-hidden group p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-white/50 z-0"></div>
            <div className="z-10 flex flex-col items-center">
              <span className="text-[120px] text-blue-700/5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-black select-none pointer-events-none">
                {targetLetter}
              </span>
              <div className="w-44 h-44 bg-gray-50 rounded-lg shadow-sm flex items-center justify-center relative z-20 mb-4 border border-gray-200">
                <span className="text-6xl font-black text-blue-700">{targetLetter}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-1 relative z-20">{lessonTitle}</h2>
              <p className="text-sm text-gray-500 relative z-20 text-center max-w-xs font-medium">
                {isDynamicLesson
                  ? `Tekan tombol "Rekam", lalu peragakan gerakan huruf ${targetLetter} menggunakan tangan Anda.`
                  : "Tirukan isyarat di atas menggunakan tangan Anda."
                }
              </p>
            </div>
          </div>

          {/* Right Panel: Camera Feed */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-lg relative overflow-hidden flex flex-col">
            {/* Camera Header */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-30 pointer-events-none">
              <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 text-white shadow-lg">
                <span className={`w-2 h-2 rounded-full ${modelStatus === 'ready' ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></span>
                <span className="text-[10px] font-bold tracking-wide">
                  {modelStatus === "ready" ? "LIVE AI" : "MENYIAPKAN..."}
                </span>
              </div>
              <button className="w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors pointer-events-auto shadow-lg">
                <Camera size={18} />
              </button>
            </div>

            {/* Camera Feed */}
            <div className="w-full h-full relative bg-gray-900 z-10 flex-grow rounded-lg overflow-hidden border border-gray-200 m-4 mt-16 mb-24">
              <Webcam
                ref={webcamRef}
                audio={false}
                mirrored={true}
                videoConstraints={{
                  facingMode: "user",
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
              
              {/* Scanning effect */}
              {modelStatus === "ready" && !handDetected && (
                 <div className="absolute top-0 left-0 w-full h-1 bg-green-400/50 shadow-[0_0_15px_rgba(74,222,128,0.8)] z-30 animate-[scan_3s_ease-in-out_infinite]"></div>
              )}
            </div>

            {/* Status Overlay (Bottom) */}
            <div className="absolute bottom-4 left-4 right-4 z-30">
              {isDynamicLesson ? (
                // Dynamic lesson: show recording controls
                <div className="bg-white border border-gray-200 shadow-sm rounded-md p-4 flex flex-col gap-2 border-l-4 border-l-blue-700">
                  {recordingError ? (
                    <div className="flex items-center gap-2 text-sm text-red-700 font-semibold">
                      <AlertTriangle size={16} className="shrink-0" />
                      {recordingError}
                    </div>
                  ) : recordingState.isRecording ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-red-500 uppercase tracking-wider animate-pulse">Merekam Gerakan...</span>
                        <span className="text-xs text-gray-400">Sisa {(recordingState.remainingMs / 1000).toFixed(1)}s</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 rounded-full transition-all duration-100"
                          style={{ width: `${(recordingState.progress / recordingState.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">Frame: {recordingState.progress}/{recordingState.total}</span>
                    </>
                  ) : dynamicResult ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hasil Deteksi</span>
                        <span className="text-2xl font-black text-blue-700">{dynamicResult.char}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={20} className={dynamicResult.char === targetLetter && dynamicResult.confidence >= 60 ? "text-green-500" : "text-amber-500"} />
                        <span className="font-bold text-gray-900">
                          {dynamicResult.char === targetLetter && dynamicResult.confidence >= 60
                            ? `Benar! Huruf ${targetLetter} berhasil dikenali!`
                            : `Terdeteksi: ${dynamicResult.char} (${Math.round(dynamicResult.confidence)}%). Coba lagi!`
                          }
                        </span>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={handleStartRecording}
                      className="w-full px-5 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-bold shadow-sm flex items-center justify-center gap-2 transition-all text-sm"
                    >
                      <Video size={16} />
                      Rekam Isyarat Huruf {targetLetter}
                    </button>
                  )}
                </div>
              ) : (
                // Static lesson: show accuracy & hold progress
                <div className="bg-white border border-gray-200 shadow-sm rounded-md p-4 flex flex-col gap-2 border-l-4 border-l-blue-700">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Akurasi AI</span>
                    <span className="text-2xl font-black text-blue-700">{conf}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={20} className={conf >= 90 ? "text-green-500" : "text-gray-400"} />
                    <span className="font-bold text-gray-900">
                      {conf >= 90 ? "Sangat Baik! Tahan posisi!" : "Coba perbaiki posisi jari Anda"}
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-1 relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-100 ${conf >= 90 ? 'bg-green-500' : 'bg-blue-700'}`} 
                      style={{ width: `${conf >= 90 ? holdProgress : conf}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>


      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
}

export default memo(function LivePracticeView() {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-[100] bg-[#f9f9ff] flex items-center justify-center text-blue-700 font-bold">Memuat...</div>}>
      <LivePracticeContent />
    </Suspense>
  );
});
