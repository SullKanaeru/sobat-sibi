# Gunakan image Python 3.10 yang ringan
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install dependensi sistem yang dibutuhkan oleh OpenCV dan MediaPipe
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set direktori kerja
WORKDIR /app

# Copy requirements.txt dan install dependensi
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy seluruh kode proyek
COPY . .

# Jalankan aplikasi utama
# Catatan: Karena aplikasi ini menggunakan antarmuka grafis (cv2.imshow) dan webcam,
# menjalankan docker ini memerlukan konfigurasi tambahan untuk X11 forwarding dan akses device (/dev/video0).
CMD ["python", "app.py"]
