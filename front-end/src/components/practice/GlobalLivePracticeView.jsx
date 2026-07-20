"use client";

import React, { memo, useEffect, useRef, useState, useCallback, Suspense } from "react";
import Webcam from "react-webcam";
import { useRouter } from "next/navigation";
import { EMPTY_RESULT } from "@/constants/kamus";
import {
  loadModel,
  predictGesture,
  resetHistory,
  startRecordingDynamic,
  addDynamicFrame,
  getRecordingState
} from "@/lib/gestureRecognizer";
import { Timer, CheckCircle2, Video, AlertTriangle } from "lucide-react";

const CANVAS_W = 320;
const CANVAS_H = 240;
const TARGET_FPS = 24;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;
const PREDICT_EVERY_N = 1;
const MIN_CONF_SHOW = 30;

function GlobalLivePracticeContent() {
  const router = useRouter();

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);

  const frameCountRef = useRef(0);
  const isUnmountedRef = useRef(false);
  const lastResultRef = useRef(EMPTY_RESULT);

  const [modelStatus, setModelStatus] = useState("idle");
  const [result, setResult] = useState(EMPTY_RESULT);
  const [handDetected, setHandDetected] = useState(false);
  const handDetectedRef = useRef(false);

  const [dynamicResult, setDynamicResult] = useState(null);
  const [recordingState, setRecordingState] = useState({ isRecording: false, progress: 0, total: 60, remainingMs: 0 });
  const [recordingError, setRecordingError] = useState(null);
  const recordingActiveRef = useRef(false);

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
        setTimeout(() => setDynamicResult(null), 5000);
      }
    });

    setRecordingState({ isRecording: true, progress: 0, total: 60, remainingMs: 5000 });
  }, []);

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

  // Use a ref to store onHandResults so MediaPipe always calls the latest version
  // without needing to re-initialize the entire Hands instance on every state change.
  const onHandResultsRef = useRef(null);

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
        } else {
          predictGesture(landmarks);
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
        }
        maybeSetResult(EMPTY_RESULT);

        // If recording and hand is lost, still call addDynamicFrame(null)
        // so the engine can pad with last known frame
        const state = getRecordingState();
        if (state.isRecording) {
          addDynamicFrame(null);
        }
      }

      // Sync recording UI state directly from engine (no polling interval needed)
      const currentState = getRecordingState();
      if (currentState.isRecording || recordingActiveRef.current) {
        recordingActiveRef.current = currentState.isRecording;
        setRecordingState(currentState);

        // Handle timeout detected by engine
        if (currentState.timedOut) {
          recordingActiveRef.current = false;
          setRecordingState({ isRecording: false, progress: 0, total: 60, remainingMs: 0 });
        }
      }

      ctx.restore();
    },
    [maybeSetResult]
  );

  // Keep the ref in sync with the latest callback version
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
        modelComplexity: 0, // Lite model: ~50% lebih cepat, akurasi landmark hampir sama
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });
      // Register a stable wrapper that always delegates to the latest callback ref.
      // This prevents landmark freezing caused by MediaPipe holding a stale callback reference.
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

        // FPS gate
        if (now - lastSendTime < FRAME_INTERVAL_MS) {
          if (!isUnmountedRef.current) cameraRef.current = requestAnimationFrame(processFrame);
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
      console.error("[GlobalLivePracticeView] Setup MediaPipe gagal:", err);
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
  const isConfident = conf >= 80;

  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in duration-500 pb-6 max-w-[1600px] mx-auto">
      {/* Header Area */}
      <div className="flex flex-col gap-0.5">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Kamera Pintar</h2>
        <p className="text-sm md:text-base text-gray-500">Arahkan tangan ke kamera, dan biarkan kamera mendeteksi isyarat yang kamu berikan.</p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Camera View Box (Main Area - Smaller, e.g. 7 cols) */}
        <div className="lg:col-span-7 bg-white border border-gray-200 shadow-sm rounded-lg p-5 flex flex-col gap-4 relative overflow-hidden min-h-[380px] h-full group">

          {/* Header inside camera frame */}
          <div className="flex justify-between items-center z-10 bg-white/90 backdrop-blur-md rounded-md px-4 py-2 shadow-sm self-start inline-flex border border-gray-200">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
              <span className={`w-2 h-2 rounded-full ${modelStatus === 'ready' ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></span>
              {modelStatus === "ready" ? "Kamera Aktif" : "Menyiapkan Kamera..."}
            </div>
          </div>

          {/* Actual Camera Feed */}
          <div className="relative flex-grow bg-gray-900 rounded-md overflow-hidden shadow-inner border border-gray-200 min-h-[300px]">
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
              className="absolute inset-0 w-full h-full object-cover z-10"
              width={CANVAS_W}
              height={CANVAS_H}
            />

            {/* Scanning effect */}
            {modelStatus === "ready" && !handDetected && (
              <div className="absolute top-0 left-0 w-full h-1 bg-green-400/50 shadow-[0_0_15px_rgba(74,222,128,0.8)] z-30 animate-[scan_3s_ease-in-out_infinite]"></div>
            )}

            {/* Simulated Camera Crosshairs */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="w-64 h-64 border-2 border-blue-500/30 rounded-lg relative">
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
              </div>
            </div>
          </div>

          {/* Record Dynamic Gesture Button / Progress / Error */}
          <div className="mt-1 flex justify-center">
            {recordingError ? (
              <div className="w-full flex items-center gap-2 bg-red-50 border border-red-200 rounded-md px-4 py-2.5 text-sm text-red-700 font-semibold animate-in fade-in duration-300">
                <AlertTriangle size={16} className="shrink-0" />
                {recordingError}
              </div>
            ) : recordingState.isRecording ? (
              <div className="w-full flex flex-col items-center gap-1.5">
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-100"
                    style={{ width: `${(recordingState.progress / recordingState.total) * 100}%` }}
                  ></div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-red-500 animate-pulse">Merekam Gerakan... ({recordingState.progress}/{recordingState.total})</span>
                  <span className="text-xs text-gray-400">Sisa {(recordingState.remainingMs / 1000).toFixed(1)}s</span>
                </div>
              </div>
            ) : (
              <button
                onClick={handleStartRecording}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-bold shadow-sm flex items-center justify-center gap-2 transition-all hover:-translate-y-1 text-sm"
              >
                <Video size={16} />
                Rekam Isyarat Dinamis
              </button>
            )}
          </div>
        </div>

        {/* Results Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">

          {/* Detected Letter Card */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-6 flex flex-col items-center justify-center flex-1 relative overflow-hidden text-center min-h-[220px]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[100px] -z-10"></div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Isyarat Terdeteksi</p>
            <div className="text-[90px] font-black text-blue-700 leading-none drop-shadow-sm mb-4">
              {displayChar || "?"}
            </div>
            <p className={`text-xs px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 font-bold ${isConfident ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
              {isConfident ? <CheckCircle2 size={14} /> : <Timer size={14} />}
              {isConfident ? 'Dikenali dengan Jelas!' : 'Sedang menganalisis...'}
            </p>
          </div>

          {/* Confidence Score Card */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-5 flex flex-col gap-3">
            <div className="flex justify-between items-end">
              <p className="text-xs font-bold text-gray-500">Skor Akurasi Prediksi</p>
              <p className="text-2xl font-black text-blue-700">{conf}%</p>
            </div>
            <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full relative overflow-hidden transition-all duration-300 ${isConfident ? 'bg-green-500' : 'bg-blue-700'}`}
                style={{ width: `${conf}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-[200%] animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(50%); }
        }
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

export default memo(function GlobalLivePracticeView() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center text-indigo-600 font-bold p-20">Memuat Kamera Pintar...</div>}>
      <GlobalLivePracticeContent />
    </Suspense>
  );
});
