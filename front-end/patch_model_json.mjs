// patch_model_json.mjs
// Jalankan SEKALI di root project Next.js:
//   node patch_model_json.mjs
//
// Script ini patch model.json agar kompatibel dengan TFJS versi lama:
// Keras 3.x pakai "batch_shape", TFJS butuh "batch_input_shape"

import fs from "fs";
import path from "path";

const MODEL_PATHS = [
  "public/models/static/model.json",
  "public/models/dynamic/model.json",
];

function patchLayers(layers) {
  for (const layer of layers) {
    const cfg = layer.config ?? {};

    // Patch InputLayer
    if (layer.class_name === "InputLayer") {
      if (cfg.batch_shape && !cfg.batch_input_shape) {
        cfg.batch_input_shape = cfg.batch_shape;
        console.log(
          `  ✅ Patched InputLayer "${cfg.name}": batch_input_shape = ${JSON.stringify(cfg.batch_shape)}`
        );
      }
      // Hapus key yang tidak dikenal TFJS
      delete cfg.optional;
    }

    // Rekursif ke dalam nested Sequential / Functional
    if (cfg.layers) {
      console.log(`  → Masuk nested layer: "${cfg.name ?? layer.class_name}"`);
      patchLayers(cfg.layers);
    }
  }
}

for (const modelPath of MODEL_PATHS) {
  if (!fs.existsSync(modelPath)) {
    console.log(`⏭  Skip (tidak ada): ${modelPath}`);
    continue;
  }

  console.log(`\n${"═".repeat(50)}`);
  console.log(`🔧 Patching: ${modelPath}`);
  console.log("═".repeat(50));

  const raw  = fs.readFileSync(modelPath, "utf-8");
  const data = JSON.parse(raw);

  const layers = data?.modelTopology?.model_config?.config?.layers;
  if (!layers) {
    console.log("❌ Struktur model.json tidak dikenali, skip.");
    continue;
  }

  patchLayers(layers);

  // Backup original
  fs.writeFileSync(modelPath + ".bak", raw);
  console.log(`  📄 Backup: ${modelPath}.bak`);

  // Tulis versi yang sudah dipatch
  fs.writeFileSync(modelPath, JSON.stringify(data));
  console.log(`  ✅ Selesai: ${modelPath}`);
}

console.log("\n🎉 Patch selesai! Restart Next.js dev server kamu.");
