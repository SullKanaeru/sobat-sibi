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

export function startRecordingDynamic(onResult) {
  dynamicBuffer = [];
  isRecordingDynamic = true;
  onDynamicResultCallback = onResult;
}

export function stopRecordingDynamic() {
  isRecordingDynamic = false;
  dynamicBuffer = [];
  onDynamicResultCallback = null;
}

export function getRecordingState() {
  return {
    isRecording: isRecordingDynamic,
    progress: dynamicBuffer.length,
    total: DYNAMIC_FRAMES,
  };
}

// ── Prediction ─────────────────────────────────────────────────────────────────

/**
 * Main prediction function called on every detected hand frame.
 * Runs the static model on the current frame's features and optionally
 * checks the dynamic model once the frame buffer is full.
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
    const dynamicFeatures = extractDynamicFeatures(handLandmarks);
    const arr = Array.from(dynamicFeatures);

    // Simple 1-frame-per-call: caller (onHandResults) is responsible for
    // calling predictGesture on every single frame during recording.
    // No dt-based duplication needed; that approach was unreliable and could
    // cause the buffer to overflow in a single lag spike (e.g. dt=600ms → 18 duplicate frames).
    if (dynamicBuffer.length < DYNAMIC_FRAMES) {
      dynamicBuffer.push(arr);
    }

    if (dynamicBuffer.length >= DYNAMIC_FRAMES) {
      isRecordingDynamic = false; // Stop recording

      let dynChar = "?";
      let dynConf = 0;

      tf.tidy(() => {
        const seqTensor   = tf.tensor3d([dynamicBuffer], [1, DYNAMIC_FRAMES, DYNAMIC_FEATURES]);
        const dynPreds    = dynamicModel.predict(seqTensor);
        const dynProbs    = dynPreds.dataSync();
        const dynClassIdx = dynPreds.argMax(-1).dataSync()[0];
        dynConf     = dynProbs[dynClassIdx] * 100;
        dynChar     = dynamicLabels[String(dynClassIdx)] ?? "?";
      });

      // Fire callback with the explicit dynamic result
      if (onDynamicResultCallback) {
        onDynamicResultCallback({
          char: dynChar,
          confidence: dynConf,
        });
        onDynamicResultCallback = null;
      }
    }
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
  predictionHistory = [];
  lastResult = { ...EMPTY_RESULT };
}
