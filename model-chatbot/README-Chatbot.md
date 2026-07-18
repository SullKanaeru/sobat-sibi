# SIBILearn Chatbot (Gestura AI) - Dokumentasi Pengembangan

Dokumen ini merangkum seluruh proses pengembangan fitur Chatbot SIBILearn, mulai dari tahap perencanaan arsitektur, instalasi, pengolahan *knowledge base* (basis pengetahuan), hingga implementasinya di dalam kode.

---

## 1. Perencanaan (Planning)

Tujuan utama dari chatbot ini adalah menciptakan asisten virtual yang interaktif bagi orang tua, anak, maupun masyarakat umum untuk mempelajari Sistem Isyarat Bahasa Indonesia (SIBI). Chatbot ini dirancang dengan kemampuan ganda: merespons teks dan memahami gambar isyarat (VQA - *Visual Question Answering*).

**Arsitektur Sistem:**
*   **Frontend (UI):** Next.js (App Router), TailwindCSS, dan Lucide Icons.
*   **Computer Vision (CV):** MediaPipe Hands dan TensorFlow.js (TF.js). Pemrosesan gambar dilakukan 100% di sisi klien (browser) untuk menjaga privasi pengguna dan mengurangi beban server.
*   **Backend API:** Next.js Route Handlers (`/api/chat`).
*   **Database:** PostgreSQL dengan Prisma ORM untuk menyimpan kamus data formasi jari SIBI.
*   **Language Model (LLM):** **Ollama** dengan base model **Llama 3** yang dijalankan secara **Lokal**. Ini dipilih agar data percakapan aman dan kita memiliki kontrol penuh atas persona chatbot tanpa biaya API bulanan (seperti ChatGPT/Anthropic).

---

## 2. Instalasi & Setup Model LLM (Installation)

Agar chatbot bisa berjalan, kita perlu membuat entitas AI baru yang mengerti bahwa dia adalah instruktur SIBI. Kita melakukannya dengan memanfaatkan **Modelfile** milik Ollama.

**Langkah-langkah yang dilakukan:**
1.  **Membuat Modelfile:** File ini terletak di `model-chatbot/Modelfile`. File ini bertindak seperti "cetak biru", di mana kita memanggil model dasar (`FROM llama3`) lalu mendefinisikan persona, gaya bahasa, dan instruksi ketat (System Prompt) yang menetapkan nama AI ini sebagai **"Gestura AI"**.
2.  **Pembuatan Skrip Otomatisasi:** Dibuat skrip `setup_model.bat`. Ketika Anda menjalankan file ini, sistem secara otomatis akan memerintahkan Ollama untuk:
    *   Mengunduh bobot/weight Llama 3 (sekitar 4.7 GB).
    *   Membungkusnya dengan Modelfile yang telah kita buat menjadi model lokal baru bernama `gestura-sibi`.

---

## 3. Basis Pengetahuan & "Training" (Knowledge Base)

Alih-alih melatih ulang model LLM dari nol yang memakan biaya mahal dan komputasi berat (*fine-tuning*), kita menggunakan teknik yang disebut **In-Context Learning / Prompt Injection** yang didukung database.

**Langkah-langkah yang dilakukan:**
1.  **Membuat Dataset:** Mengumpulkan penjelasan tekstual langkah demi langkah tentang bagaimana bentuk jari untuk huruf SIBI A-Z. Dataset ini disimpan di `front-end/src/data/sibi_knowledge.json`.
2.  **Database Seeding:** Membuat skrip `prisma/seed.js` untuk memasukkan data dari JSON tersebut langsung ke dalam tabel `Dictionary` di PostgreSQL Anda.
3.  **Dinamika Prompt:** Setiap kali LLM ditanya, kita memastikan dia memiliki contekan formasi jari yang akurat dan terkalibrasi khusus SIBI (karena LLM umum kadang halusinasi antara ASL Amerika dan SIBI Indonesia).

---

## 4. Implementasi (Implementation)

Tahap implementasi adalah merangkai Frontend, Backend, Database, TF.js, dan Ollama menjadi satu kesatuan alur kerja yang mulus.

### A. Implementasi Backend (`src/app/api/chat/route.js`)
*   Menerima riwayat percakapan dari antarmuka pengguna.
*   **Context Injection:** Sebelum mengirim riwayat obrolan ke Ollama, API akan melakukan *query* ke Prisma (`prisma.dictionary.findMany`) untuk mengambil seluruh panduan abjad SIBI.
*   Backend kemudian memodifikasi *System Prompt* pengguna dengan menempelkan panduan tersebut.
*   Backend melakukan *fetch* HTTP ke server Ollama lokal (`http://localhost:11434/api/chat`), menunggu respons, dan mengembalikan format JSON yang dapat dibaca oleh UI.

### B. Implementasi Frontend & Vision (`src/app/chatbot/page.jsx`)
*   **Chat Interface:** UI menampilkan percakapan. Saat tombol kirim ditekan, teks dikirim ke `/api/chat`.
*   **Image Upload & TF.js:** Jika pengguna menekan ikon `+` dan mengunggah gambar tangan:
    1.  Gambar langsung diproses secara asinkron menggunakan instance `Hands` dari MediaPipe.
    2.  Landmark koordinat tulang (21 titik jari) diekstrak.
    3.  Koordinat tersebut diteruskan ke model *neural network* statis TF.js milik Anda (`gestureRecognizer.js`) untuk memprediksi huruf apa yang diperagakan dan berapa persentase keyakinannya.
    4.  **Jembatan Vision-to-Text:** Jika gambar terdeteksi sebagai huruf "B", UI secara otomatis membuat *prompt* teks tak kasat mata: *"Pengguna mengunggah gambar isyarat. Gambar terdeteksi sebagai isyarat huruf B... Tolong jelaskan formasi jarinya"*. Prompt ini dikirim ke Ollama, dan LLM akan menjawab dengan bahasa natural seolah-olah dia sendiri yang melihat gambar tersebut!

---

## Kesimpulan

Sistem ini menunjukkan desain **Edge-AI** modern yang tangguh. AI Penglihatan (TF.js) berjalan di perangkat klien tanpa delay internet, sementara AI Bahasa (Ollama) berjalan stabil di backend lokal. Hasilnya adalah asisten belajar bahasa isyarat yang interaktif, menjaga privasi tinggi, dan sangat mudah untuk dikembangkan atau ditambah kosakatanya di masa mendatang!
