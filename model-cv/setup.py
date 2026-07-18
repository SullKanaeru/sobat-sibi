import sys
from cx_Freeze import setup, Executable

build_exe_options = {
    "packages": ["os", "cv2", "numpy", "mediapipe", "tensorflow"],
    "include_files": [("models", "models")],
    "excludes": ["tkinter"],
}

base = None
# Untuk menyembunyikan console (terminal) saat aplikasi dijalankan, hapus tanda pagar pada baris di bawah ini:
# if sys.platform == "win32": base = "Win32GUI"

setup(
    name="SIBI_Translator",
    version="1.0",
    description="Aplikasi Penerjemah SIBI Real-time",
    options={"build_exe": build_exe_options},
    executables=[Executable("app.py", base=base, target_name="SIBITranslator.exe")]
)
