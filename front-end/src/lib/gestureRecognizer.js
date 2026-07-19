// ── lib/gestureRecognizer.js ───────────────────────────────────────────────────
// Gesture recognition engine for SIBI sign language detection.
// Uses two models:
//   1. Static Dense model  (277 features)  → detects letters A-I, K-Y
//   2. Dynamic LSTM model  (60×63 features) → detects J and Z (motion-based)
//
// Feature pipeline mirrors the Python training pipeline exactly:
//   1. Wrist-relative normalization (subtract landmark 0)
//   2. Pairwise Euclidean distances (210 features)
//   3. Scale invariance (divide by max absolute coordinate)
//   4. Signed crossing features (4 features: index vs middle fingertip X/Z)
// ──────────────────────────────────────────────────────────────────────────────

import * as tf from "@tensorflow/tfjs";
import { EMPTY_RESULT } from "@/constants/kamus";

// ── Model paths (served from /public) ─────────────────────────────────────────
const STATIC_MODEL_URL  = "/models/tfjs_static/model.json";
const DYNAMIC_MODEL_URL = "/models/tfjs_dynamic/model.json";
const STATIC_LABEL_URL  = "/models/tfjs_static/label_map.json";
const DYNAMIC_LABEL_URL = "/models/tfjs_dynamic/label_map.json";

// ── Constants ──────────────────────────────────────────────────────────────────
const DYNAMIC_FRAMES   = 60;  // Must match training (2 seconds at 30fps)
const STATIC_FEATURES  = 277; // 63 coords + 210 distances + 4 crossing
const DYNAMIC_FEATURES = 63;  // 21 landmarks × 3 coordinates (wrist-relative)

// Recording constraints
const RECORDING_TIMEOUT_MS = 5000; // Max 5 seconds to fill buffer
const MAX_PADDING_FRAMES   = 5;    // Max consecutive padded frames when hand lost

// MediaPipe landmark indices for the "crossing" feature (U vs R disambiguation)
const IDX_INDEX_TIP  = 8;
const IDX_MIDDLE_TIP = 12;
const IDX_INDEX_PIP  = 7;
const IDX_MIDDLE_PIP = 11;

// ── Module-level state ─────────────────────────────────────────────────────────
let staticModel  = null;
let dynamicModel = null;
let staticLabels  = {}; // { "0": "A", "1": "B", ... }
let dynamicLabels = {}; // { "0": "J", "1": "Z" }

// Dynamic gesture buffer
let dynamicBuffer = [];
let isRecordingDynamic = false;
let onDynamicResultCallback = null;
let recordingStartTime = 0;
let lastKnownFrame = null;      // Last valid frame for padding
let consecutivePadding = 0;     // Track consecutive padded frames

let lastResult    = { ...EMPTY_RESULT };

// Smoothing: majority-vote over last N predictions to reduce flicker
const SMOOTH_WINDOW = 5;
let predictionHistory = [];

// ── Feature Engineering ────────────────────────────────────────────────────────

/**
 * Converts 21 MediaPipe landmarks into the 277-dimensional static feature vector.
 * This function is the JavaScript equivalent of `normalize_landmarks()` in
 * the Python training scripts (04_train_static.py and app.py).
 *
 * @param {Array} landmarks - Array of 21 objects with { x, y, z }.
 * @returns {Float32Array} Feature vector of length 277.
 */
function extractStaticFeatures(landmarks) {
  const wx = landmarks[0].x;
  const wy = landmarks[0].y;
  const wz = landmarks[0].z;

  // 1. Wrist-relative normalized coordinates (63 features)
  // NOTE: X is negated to match the Python training pipeline which used cv2.flip(frame, 1).
  // The webcam feed is displayed mirrored (scaleX=-1 on video), so the raw MediaPipe
  // landmark X coordinates are from the un-flipped camera. We negate X here to match
  // the flipped-frame distribution that the static model was trained on.
  const normCoords = [];
  const points = [];
  for (let i = 0; i < 21; i++) {
    const nx = -(landmarks[i].x - wx); // negate X to match cv2.flip(frame,1) training
    const ny = landmarks[i].y - wy;
    const nz = landmarks[i].z - wz;
    normCoords.push(nx, ny, nz);
    points.push([nx, ny, nz]);
  }

  // 2. Scale invariance: divide by max absolute coordinate value
  let maxVal = 0;
  for (const v of normCoords) {
    const a = Math.abs(v);
    if (a > maxVal) maxVal = a;
  }
  const scale = maxVal > 0 ? maxVal : 1.0;
  const scaledCoords = normCoords.map((v) => v / scale);

  // 3. Pairwise Euclidean distances (210 features), also scale-normalized
  const distances = [];
  for (let p1 = 0; p1 < 21; p1++) {
    for (let p2 = p1 + 1; p2 < 21; p2++) {
      const dx = points[p1][0] - points[p2][0];
      const dy = points[p1][1] - points[p2][1];
      const dz = points[p1][2] - points[p2][2];
      distances.push(Math.sqrt(dx * dx + dy * dy + dz * dz) / scale);
    }
  }

  // 4. Signed crossing features (4 features)
  // These directly encode whether index and middle fingers are CROSSED (R) or PARALLEL (U).
  const crossXTip = (points[IDX_INDEX_TIP][0]  - points[IDX_MIDDLE_TIP][0]) / scale;
  const crossZTip = (points[IDX_INDEX_TIP][2]  - points[IDX_MIDDLE_TIP][2]) / scale;
  const crossXPip = (points[IDX_INDEX_PIP][0]  - points[IDX_MIDDLE_PIP][0]) / scale;
  const crossZPip = (points[IDX_INDEX_PIP][2]  - points[IDX_MIDDLE_PIP][2]) / scale;

  return new Float32Array([
    ...scaledCoords,
    ...distances,
    crossXTip, crossZTip, crossXPip, crossZPip,
  ]);
}

/**
 * Converts 21 MediaPipe landmarks into the 63-dimensional dynamic feature vector.
 * Used for the LSTM dynamic model (J and Z).
 *
 * @param {Array} landmarks - Array of 21 objects with { x, y, z }.
 * @returns {Float32Array} Feature vector of length 63.
 */
function extractDynamicFeatures(landmarks) {
  const wx = landmarks[0].x;
  const wy = landmarks[0].y;
  const wz = landmarks[0].z;

  const flat = [];
  for (let i = 0; i < 21; i++) {
    // Negate X to match cv2.flip(frame, 1) used during Python training
    flat.push(-(landmarks[i].x - wx), landmarks[i].y - wy, landmarks[i].z - wz);
  }

  // Scale invariance per frame
  let maxVal = 0;
  for (const v of flat) {
    const a = Math.abs(v);
    if (a > maxVal) maxVal = a;
  }
  const scale = maxVal > 0 ? maxVal : 1.0;

  return new Float32Array(flat.map((v) => v / scale));
}

// ── Frame Interpolation ────────────────────────────────────────────────────────

/**
 * Resamples a buffer of N frames to exactly targetCount frames using linear interpolation.
 * This corrects the FPS mismatch between the actual capture rate (~15-20fps) and the
 * training rate (30fps → 60 frames = 2 seconds).
 *
 * @param {Array<Array<number>>} buffer - Input frames, each of length DYNAMIC_FEATURES.
 * @param {number} targetCount - Desired number of output frames (default: DYNAMIC_FRAMES).
 * @returns {Array<Array<number>>} Resampled buffer of exactly targetCount frames.
 */
function resampleFrames(buffer, targetCount = DYNAMIC_FRAMES) {
  const srcLen = buffer.length;
  if (srcLen === 0) return [];
  if (srcLen === 1) {
    // Edge case: only one frame, replicate it
    return Array.from({ length: targetCount }, () => [...buffer[0]]);
  }
  if (srcLen === targetCount) return buffer;

  const result = [];
  for (let i = 0; i < targetCount; i++) {
    // Map target index to source position (floating point)
    const srcPos = (i / (targetCount - 1)) * (srcLen - 1);
    const loIdx = Math.floor(srcPos);
    const hiIdx = Math.min(loIdx + 1, srcLen - 1);
    const frac = srcPos - loIdx;

    // Linear interpolation between two adjacent source frames
    const interpolated = [];
    for (let f = 0; f < DYNAMIC_FEATURES; f++) {
      interpolated.push(
        buffer[loIdx][f] * (1 - frac) + buffer[hiIdx][f] * frac
      );
    }
    result.push(interpolated);
  }
  return result;
}

// ── Smoothing ──────────────────────────────────────────────────────────────────

/**
 * Returns the most frequently occurring character in the prediction history.
 * Used to eliminate single-frame noise and stabilize the displayed character.
 *
 * @param {string} newChar - The latest predicted character.
 * @returns {string} The majority-vote smoothed character.
 */
function getSmoothedChar(newChar) {
  predictionHistory.push(newChar);
  if (predictionHistory.length > SMOOTH_WINDOW) predictionHistory.shift();

  const counts = {};
  for (const c of predictionHistory) counts[c] = (counts[c] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// ── Model Loading ──────────────────────────────────────────────────────────────

/**
 * Loads both the static and dynamic TensorFlow.js models from the public folder.
 * Also fetches the label maps so predictions can be decoded to letter strings.
 * Safe to call multiple times; will skip if already loaded.
 */
export async function loadModel() {
  if (staticModel && dynamicModel) return;

  console.log("[SIBI] Loading models...");

  // Load static model + label map
  const [sModel, sLabels] = await Promise.all([
    tf.loadLayersModel(STATIC_MODEL_URL),
    fetch(STATIC_LABEL_URL).then((r) => r.json()),
  ]);
  staticModel  = sModel;
  staticLabels = sLabels;
  console.log("[SIBI] Static model ready. Classes:", Object.values(sLabels).join(", "));

  // Load dynamic model + label map
  const [dModel, dLabels] = await Promise.all([
    tf.loadLayersModel(DYNAMIC_MODEL_URL),
    fetch(DYNAMIC_LABEL_URL).then((r) => r.json()),
  ]);
  dynamicModel  = dModel;
  dynamicLabels = dLabels;
  console.log("[SIBI] Dynamic model ready. Classes:", Object.values(dLabels).join(", "));

  // Warm up both models with a dummy prediction to avoid cold-start latency
  tf.tidy(() => {
    staticModel.predict(tf.zeros([1, STATIC_FEATURES]));
    dynamicModel.predict(tf.zeros([1, DYNAMIC_FRAMES, DYNAMIC_FEATURES]));
  });
  console.log("[SIBI] Both models warmed up and ready.");
}

// ── Explicit Recording Control ─────────────────────────────────────────────────

/**
 * Starts recording dynamic gesture frames.
 * The recording will automatically stop when:
 *   - Buffer reaches a minimum of 20 frames and the timeout is hit, OR
 *   - Buffer reaches DYNAMIC_FRAMES (60) naturally
 *
 * @param {Function} onResult - Callback with { char, confidence } when prediction completes.
 * @returns {void}
 */
export function startRecordingDynamic(onResult) {
  dynamicBuffer = [];
  isRecordingDynamic = true;
  onDynamicResultCallback = onResult;
  recordingStartTime = Date.now();
  lastKnownFrame = null;
  consecutivePadding = 0;
}

export function stopRecordingDynamic() {
  isRecordingDynamic = false;
  dynamicBuffer = [];
  onDynamicResultCallback = null;
  lastKnownFrame = null;
  consecutivePadding = 0;
}

/**
 * Returns the current recording state for UI rendering.
 * Includes an `error` field if the recording has timed out.
 */
export function getRecordingState() {
  const elapsed = isRecordingDynamic ? Date.now() - recordingStartTime : 0;
  const remainingMs = Math.max(0, RECORDING_TIMEOUT_MS - elapsed);

  return {
    isRecording: isRecordingDynamic,
    progress: dynamicBuffer.length,
    total: DYNAMIC_FRAMES,
    remainingMs,
    timedOut: isRecordingDynamic && elapsed > RECORDING_TIMEOUT_MS,
  };
}

/**
 * Returns the last prediction result (for summary page).
 */
export function getLastResult() {
  return { ...lastResult };
}

// ── Dynamic Frame Collection ───────────────────────────────────────────────────

/**
 * Adds a frame to the dynamic buffer during recording.
 * Handles padding when hand is lost and triggers prediction when ready.
 *
 * @param {Array|null} landmarks - 21 MediaPipe landmarks, or null if hand lost.
 * @returns {{ char: string, confidence: number }|null} Result if prediction was triggered.
 */
export function addDynamicFrame(landmarks) {
  if (!isRecordingDynamic || !dynamicModel) return null;

  // Check timeout
  const elapsed = Date.now() - recordingStartTime;
  if (elapsed > RECORDING_TIMEOUT_MS) {
    // Timeout reached — try to predict with what we have if we have enough frames
    if (dynamicBuffer.length >= 15) {
      return finalizeDynamicPrediction();
    } else {
      // Not enough frames, recording failed
      isRecordingDynamic = false;
      const cb = onDynamicResultCallback;
      onDynamicResultCallback = null;
      if (cb) {
        cb({ char: "?", confidence: 0, error: "timeout" });
      }
      return null;
    }
  }

  if (landmarks) {
    // Valid hand detected — extract features and add to buffer
    const features = extractDynamicFeatures(landmarks);
    const arr = Array.from(features);
    lastKnownFrame = arr;
    consecutivePadding = 0;

    if (dynamicBuffer.length < DYNAMIC_FRAMES) {
      dynamicBuffer.push(arr);
    }
  } else if (lastKnownFrame && consecutivePadding < MAX_PADDING_FRAMES) {
    // Hand lost but we have a previous frame — pad with last known frame
    consecutivePadding++;
    if (dynamicBuffer.length < DYNAMIC_FRAMES) {
      dynamicBuffer.push([...lastKnownFrame]);
    }
  }
  // If hand lost and no lastKnownFrame or exceeded padding limit, skip this frame

  // Check if we have enough frames to predict
  if (dynamicBuffer.length >= DYNAMIC_FRAMES) {
    return finalizeDynamicPrediction();
  }

  return null;
}

/**
 * Runs the LSTM model on the collected buffer (with resampling if needed)
 * and fires the callback with the result.
 */
function finalizeDynamicPrediction() {
  isRecordingDynamic = false;

  // Resample to exactly DYNAMIC_FRAMES using linear interpolation
  const resampled = resampleFrames(dynamicBuffer, DYNAMIC_FRAMES);

  let dynChar = "?";
  let dynConf = 0;

  tf.tidy(() => {
    const seqTensor   = tf.tensor3d([resampled], [1, DYNAMIC_FRAMES, DYNAMIC_FEATURES]);
    const dynPreds    = dynamicModel.predict(seqTensor);
    const dynProbs    = dynPreds.dataSync();
    const dynClassIdx = dynPreds.argMax(-1).dataSync()[0];
    dynConf     = dynProbs[dynClassIdx] * 100;
    dynChar     = dynamicLabels[String(dynClassIdx)] ?? "?";
  });

  const result = { char: dynChar, confidence: dynConf };

  // Fire callback
  if (onDynamicResultCallback) {
    onDynamicResultCallback(result);
    onDynamicResultCallback = null;
  }

  // Clean up
  dynamicBuffer = [];
  lastKnownFrame = null;
  consecutivePadding = 0;

  return result;
}

// ── Prediction ─────────────────────────────────────────────────────────────────

/**
 * Main prediction function called on every detected hand frame.
 * Runs the static model on the current frame's features and optionally
 * adds to the dynamic buffer if recording.
 *
 * @param {Array} handLandmarks - Array of 21 MediaPipe landmark objects.
 * @returns {{ smoothedChar: string, confidence: number, rawChar: string }} Result object.
 */
export function predictGesture(handLandmarks) {
  if (!staticModel || !dynamicModel) return { ...EMPTY_RESULT };

  // ── Static prediction (runs every frame) ────────────────────────────────────
  const staticFeatures = extractStaticFeatures(handLandmarks);

  let staticChar = "";
  let staticConf = 0;

  tf.tidy(() => {
    const inputTensor = tf.tensor2d([Array.from(staticFeatures)], [1, STATIC_FEATURES]);
    const predictions = staticModel.predict(inputTensor);
    const probsArray  = predictions.dataSync();
    const classIdx    = predictions.argMax(-1).dataSync()[0];
    staticConf = probsArray[classIdx] * 100;
    staticChar = staticLabels[String(classIdx)] ?? "?";
  });

  // ── Dynamic recording update ────────────────────────────────────────────────
  if (isRecordingDynamic) {
    addDynamicFrame(handLandmarks);
  }

  // ── Normal Return (Static Only) ─────────────────────────────────────────────
  const smoothed = getSmoothedChar(staticChar);
  lastResult = {
    rawChar: staticChar,
    smoothedChar: smoothed,
    confidence: staticConf,
    isConfident: staticConf >= 70,
  };

  return { ...lastResult };
}

// ── Reset ──────────────────────────────────────────────────────────────────────

/**
 * Resets the internal gesture history buffers.
 * Should be called when the camera is stopped or the component unmounts.
 */
export function resetHistory() {
  dynamicBuffer = [];
  isRecordingDynamic = false;
  onDynamicResultCallback = null;
  lastKnownFrame = null;
  consecutivePadding = 0;
  predictionHistory = [];
  lastResult = { ...EMPTY_RESULT };
}
