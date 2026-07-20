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
import { ArrowLeft, Timer, Camera, CheckCircle2, AlertTriangle } from "lucide-react";

const CANVAS_W = 320;
const CANVAS_H = 240;
const TARGET_FPS = 24;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;
const PREDICT_EVERY_N = 1;

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
  const handDetectedRef = useRef(false);
  const [timer, setTimer] = useState(60); // 60 seconds timer
  
  // Latihan 3-Repetitions State Machine
  const [currentRep, setCurrentRep] = useState(1);
  const [practiceState, setPracticeState] = useState("idle"); // idle, countdown, recording, evaluating, success, error
  const practiceStateRef = useRef("idle"); // For sync access in callbacks
  const [countdownVal, setCountdownVal] = useState(3);
  const [holdProgress, setHoldProgress] = useState(0); 
  const repFeedbackRef = useRef({ type: "", text: "" });

  // Dynamic recording state (just for UI progress sync)
  const [recordingState, setRecordingState] = useState({ isRecording: false, progress: 0, total: 60, remainingMs: 0 });
  const recordingActiveRef = useRef(false);

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

  // ---------------------------------------------------------
  // PRACTICE STATE MACHINE
  // ---------------------------------------------------------
  useEffect(() => {
    let timeoutId;
    let intervalId;
    let animationFrameId;

    if (practiceState === "idle") {
      if (handDetected) {
        practiceStateRef.current = "countdown";
        setPracticeState("countdown");
        setCountdownVal(3);
      }
    } 
    else if (practiceState === "countdown") {
      intervalId = setInterval(() => {
        setCountdownVal((prev) => {
          if (prev <= 1) {
            clearInterval(intervalId);
            practiceStateRef.current = "recording";
            setPracticeState("recording");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    else if (practiceState === "recording") {
      if (isDynamicLesson) {
        // --- DYNAMIC GESTURE RECORDING ---
        startRecordingDynamic((res) => {
          if (res.error === "timeout") {
            repFeedbackRef.current = { type: "error", text: "Tangan hilang. Coba lagi." };
            practiceStateRef.current = "error";
            setPracticeState("error");
          } else {
            if (res.char === targetLetter && res.confidence >= 60) {
              repFeedbackRef.current = { type: "success", text: `Benar! Huruf ${targetLetter}` };
              practiceStateRef.current = "success";
              setPracticeState("success");
            } else {
              repFeedbackRef.current = { type: "error", text: `Salah, terdeteksi: ${res.char}` };
              practiceStateRef.current = "error";
              setPracticeState("error");
            }
          }
        });
      } else {
        // --- STATIC GESTURE RECORDING (3s Hold) ---
        const startTime = Date.now();
        setHoldProgress(0);

        const updateProgress = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min((elapsed / 3000) * 100, 100);
          setHoldProgress(progress);
          
          if (progress >= 100) {
            practiceStateRef.current = "evaluating";
            setPracticeState("evaluating");
            
            // Wait a tiny bit to ensure we capture the absolute last frame result
            setTimeout(() => {
              const finalResult = lastResultRef.current;
              if (finalResult.smoothedChar === targetLetter && finalResult.confidence >= 60) {
                 repFeedbackRef.current = { type: "success", text: `Benar! Huruf ${targetLetter}` };
                 practiceStateRef.current = "success";
                 setPracticeState("success");
              } else {
                 const detected = finalResult.smoothedChar !== "..." ? finalResult.smoothedChar : "?";
                 repFeedbackRef.current = { type: "error", text: `Salah, terdeteksi: ${detected}` };
                 practiceStateRef.current = "error";
                 setPracticeState("error");
              }
            }, 50);

          } else {
            animationFrameId = requestAnimationFrame(updateProgress);
          }
        };
        animationFrameId = requestAnimationFrame(updateProgress);
      }
    }
    else if (practiceState === "success") {
      timeoutId = setTimeout(() => {
        if (currentRep < 3) {
          setCurrentRep(prev => prev + 1);
          practiceStateRef.current = "idle";
          setPracticeState("idle");
        } else {
          // Finished all 3 reps
          if (lessonId) {
            fetch(`/api/lessons/${lessonId}/complete`, { method: "POST" })
              .catch(err => console.error("Error saving progress:", err))
              .finally(() => {
                practiceStateRef.current = "completed";
                setPracticeState("completed");
              });
          } else {
            practiceStateRef.current = "completed";
            setPracticeState("completed");
          }
        }
      }, 2000);
    }
    else if (practiceState === "error") {
      timeoutId = setTimeout(() => {
        practiceStateRef.current = "idle";
        setPracticeState("idle");
      }, 2500);
    }

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [practiceState, handDetected, isDynamicLesson, targetLetter, currentRep, lessonId, router]);

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
        }

        if (!handDetectedRef.current) {
          handDetectedRef.current = true;
          setHandDetected(true);
        }
      } else {
        frameCountRef.current = 0;
        
        if (handDetectedRef.current) {
          handDetectedRef.current = false;
          setHandDetected(false);
          // Cancel countdown if hand is lost
          if (practiceStateRef.current === "countdown") {
            practiceStateRef.current = "idle";
            setPracticeState("idle");
          }
        }
        
        maybeSetResult(EMPTY_RESULT);

        // If recording dynamic and hand is lost, pad with last known frame
        const state = getRecordingState();
        if (state.isRecording) {
          addDynamicFrame(null);
        }
      }

      // Sync dynamic recording UI state
      if (isDynamicLesson) {
        const currentState = getRecordingState();
        if (currentState.isRecording || recordingActiveRef.current) {
          recordingActiveRef.current = currentState.isRecording;
          setRecordingState(currentState);
        }
      }

      ctx.restore();
    },
    [maybeSetResult, isDynamicLesson]
  );

  // Keep the ref in sync with the latest callback
  useEffect(() => {
    onHandResultsRef.current = onHandResults;
  }, [onHandResults]);

  const setupMediaPipe = useCallback(async () => {
    while (!webcamRef.current || !canvasRef.current) {
      if (isUnmountedRef.current) return;
      await new Promise(r => setTimeout(r, 50));
    }

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
        modelComplexity: 0, 
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });
      hands.onResults((results) => {
        if (onHandResultsRef.current) onHandResultsRef.current(results);
      });
      await hands.initialize();
      handsRef.current = hands;

      let isSending = false;
      let lastSendTime = 0;
      const processFrame = async (now) => {
        if (isUnmountedRef.current) return;

        if (!webcamRef.current || !webcamRef.current.video) {
          cameraRef.current = requestAnimationFrame(processFrame);
          return;
        }

        if (now - lastSendTime < FRAME_INTERVAL_MS) {
          cameraRef.current = requestAnimationFrame(processFrame);
          return;
        }

        const video = webcamRef.current.video;
        if (!video.paused && !video.ended && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0 && !isSending && handsRef.current) {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isMounted = true;
    isUnmountedRef.current = false;
    setModelStatus("loading");

    (async () => {
      try {
        await loadModel();
        if (!isMounted) return;
        setModelStatus("ready");
        if (isMounted) await setupMediaPipe();
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

      // Close hands synchronously on unmount
      if (handsRef.current) {
        try { handsRef.current.close(); } catch (e) { }
        handsRef.current = null;
      }

      resetHistory();
      frameCountRef.current = 0;
      lastResultRef.current = EMPTY_RESULT;
    };
  }, [setupMediaPipe]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col h-screen overflow-hidden text-gray-900 bg-[#f9f9ff]">
      {/* Background */}
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
              <path className="text-blue-700 stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray={`${(timer/60)*100}, 100`} strokeWidth="3"></path>
            </svg>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow pt-[80px] pb-6 px-4 lg:px-6 flex flex-col h-full relative z-10 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full min-h-[380px]">
          
          <div className="bg-white border border-gray-200 shadow-sm rounded-lg flex flex-col items-center justify-center relative overflow-hidden group p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-white/50 z-0"></div>
            <div className="z-10 flex flex-col items-center w-full mt-4">
              <div className="w-56 h-56 md:w-72 md:h-72 flex items-center justify-center relative z-20 mb-6">
                <img 
                  src={lessonTitle.toLowerCase().includes("angka") 
                    ? `/images/dict/angka/sibi_${targetLetter.toLowerCase()}.png` 
                    : `/images/dict/huruf/sibi_${targetLetter.toLowerCase()}.png`
                  } 
                  alt={`Isyarat ${targetLetter}`} 
                  className="w-full h-full object-contain drop-shadow-xl"
                  onError={(e) => {
                    e.target.classList.add('hidden');
                    e.target.nextSibling.classList.remove('hidden');
                    e.target.nextSibling.classList.add('flex');
                  }}
                />
                {/* Fallback if image not found */}
                <div className="hidden w-44 h-44 bg-gray-50 rounded-2xl shadow-sm flex-col items-center justify-center border border-gray-200">
                  <span className="text-5xl font-black text-blue-700">{targetLetter.length > 3 ? targetLetter.substring(0,3) : targetLetter}</span>
                </div>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2 relative z-20 tracking-tight">{lessonTitle}</h2>
              <p className="text-sm text-gray-500 relative z-20 text-center max-w-sm font-medium leading-relaxed">
                {isDynamicLesson
                  ? `Peragakan gerakan isyarat ${lessonTitle} setelah hitung mundur.`
                  : `Tahan posisi isyarat ${lessonTitle} selama 3 detik setelah hitung mundur.`
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

              {/* OVERLAYS based on State */}
              {practiceState === "countdown" && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
                  <span className="text-9xl font-black text-white drop-shadow-2xl animate-in zoom-in duration-200">
                    {countdownVal}
                  </span>
                </div>
              )}

              {(practiceState === "success" || practiceState === "error") && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all">
                  <div className={`px-8 py-6 rounded-2xl flex flex-col items-center gap-3 transform transition-all animate-in zoom-in-90 duration-300 shadow-2xl ${practiceState === "success" ? "bg-green-500" : "bg-red-500"}`}>
                     {practiceState === "success" ? <CheckCircle2 size={56} className="text-white" /> : <AlertTriangle size={56} className="text-white" />}
                     <span className="text-2xl font-black text-white tracking-wide text-center">{repFeedbackRef.current.text}</span>
                  </div>
                </div>
              )}

              {practiceState === "completed" && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all">
                  <div className="bg-white px-8 py-8 rounded-2xl flex flex-col items-center gap-4 transform transition-all animate-in zoom-in-90 duration-300 shadow-2xl max-w-sm w-11/12 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-2">
                       <CheckCircle2 size={40} className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 mb-2">Latihan Selesai!</h3>
                      <p className="text-gray-500 font-medium leading-relaxed">Anda telah berhasil menyelesaikan seluruh 3 repetisi latihan dengan sangat baik.</p>
                    </div>
                    <button 
                      onClick={() => router.back()}
                      className="mt-2 w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl font-bold transition-all"
                    >
                      Kembali ke Materi
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Status Overlay (Bottom) */}
            <div className="absolute bottom-4 left-4 right-4 z-30">
              <div className="bg-white border border-gray-200 shadow-sm rounded-md p-4 flex flex-col gap-3 border-l-4 border-l-blue-700">
                
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Latihan {currentRep} dari 3</span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map(rep => (
                       <div key={rep} className={`w-2.5 h-2.5 rounded-full transition-colors ${rep < currentRep ? "bg-green-500" : rep === currentRep ? "bg-blue-600 animate-pulse" : "bg-gray-200"}`} />
                    ))}
                  </div>
                </div>

                {practiceState === "idle" && (
                  <div className="text-center py-1">
                    <p className="font-bold text-gray-900 text-sm">Arahkan tangan ke kamera untuk memulai</p>
                  </div>
                )}

                {practiceState === "countdown" && (
                  <div className="text-center py-1">
                    <p className="font-bold text-blue-700 text-sm animate-pulse">Bersiap...</p>
                  </div>
                )}

                {practiceState === "recording" && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-red-500 uppercase tracking-wider animate-pulse">
                        {isDynamicLesson ? "Merekam Gerakan..." : "Tahan Posisi..."}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 rounded-full transition-all duration-100 ease-linear"
                        style={{ width: `${isDynamicLesson ? (recordingState.progress / recordingState.total) * 100 : holdProgress}%` }}
                      ></div>
                    </div>
                  </>
                )}
                
                {practiceState === "evaluating" && (
                   <div className="text-center py-1">
                      <p className="font-bold text-gray-900 text-sm animate-pulse">Mengevaluasi...</p>
                   </div>
                )}

                {(practiceState === "success" || practiceState === "error") && (
                   <div className="text-center py-1">
                      <p className={`font-bold text-sm ${practiceState === "success" ? "text-green-600" : "text-red-600"}`}>
                        {practiceState === "success" ? "Kerja Bagus!" : "Coba lagi..."}
                      </p>
                   </div>
                )}

              </div>
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
