@echo off
title SIBI Translator
echo ==========================================
echo Membuka Aplikasi SIBI Translator...
echo Mohon tunggu sebentar (memuat model)...
echo ==========================================
cd /d "%~dp0"
if exist ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" app.py
) else (
    python app.py
)
pause
