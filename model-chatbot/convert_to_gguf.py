# convert_to_gguf.py
# Ini script simpel untuk konversi via Python tanpa build llama.cpp

import os
import json
import struct
import numpy as np
from pathlib import Path
from safetensors import safe_open

print("=" * 60)
print("KONVERSI MODEL KE GGUF")
print("=" * 60)

model_dir = "model_SIBI"
output_file = "model_SIBI.gguf"

# Baca config
with open(f"{model_dir}/config.json", "r") as f:
    config = json.load(f)

print(f"✓ Config loaded: {config.get('model_type', 'unknown')}")

# Hitung total tensors
total_size = 0
tensor_count = 0

for file_name in sorted(os.listdir(model_dir)):
    if file_name.endswith(".safetensors"):
        file_path = f"{model_dir}/{file_name}"
        with safe_open(file_path, framework="pt") as f:
            for key in f.keys():
                tensor = f.get_tensor(key)
                total_size += tensor.numel() * tensor.element_size()
                tensor_count += 1

print(f"✓ Total tensors: {tensor_count}")
print(f"✓ Total size: {total_size / 1024**3:.2f} GB")
print(f"⚠️  Konversi manual GGUF cukup kompleks.")
print(f"   Disarankan pakai tools resmi.")