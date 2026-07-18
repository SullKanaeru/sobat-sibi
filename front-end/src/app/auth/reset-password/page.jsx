// src/app/auth/reset-password/page.jsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle2, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { useToast, ToastContainer } from "@/components/ui/Toast";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const { toasts, dismiss, toast } = useToast();

  const [status, setStatus] = useState("verifying"); // verifying | valid | invalid | submitting | success
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    // Verify token
    fetch(`/api/auth/reset-password?token=${token}`)
      .then((r) => r.json())
      .then((data) => setStatus(data.valid ? "valid" : "invalid"))
      .catch(() => setStatus("invalid"));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < 8) {
      toast.error("Kata sandi terlalu pendek", "Kata sandi minimal 8 karakter.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Kata sandi tidak cocok", "Konfirmasi kata sandi tidak sesuai.");
      return;
    }

    setStatus("submitting");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...formData }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msgMap = {
          TOKEN_EXPIRED: "Tautan sudah kedaluwarsa. Silakan minta tautan reset baru.",
          TOKEN_USED: "Tautan ini sudah pernah digunakan.",
          TOKEN_INVALID: "Tautan tidak valid.",
          PASSWORD_TOO_SHORT: data.message,
          PASSWORD_MISMATCH: data.message,
          SERVER_ERROR: data.message,
        };
        toast.error("Reset gagal", msgMap[data.error] || data.message);
        setStatus("valid");
        return;
      }

      setStatus("success");
    } catch {
      toast.error("Tidak dapat terhubung", "Periksa koneksi internet Anda.");
      setStatus("valid");
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-100 overflow-hidden">
            {/* Header bar */}
            <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />

            <div className="p-8">
              {/* Logo */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 mb-4">
                  <Lock size={28} className="text-indigo-600" />
                </div>
                <h1 className="text-2xl font-black text-gray-900">Reset Kata Sandi</h1>
                <p className="text-gray-500 text-sm mt-1">Buat kata sandi baru untuk akun Anda</p>
              </div>

              {/* Verifying */}
              {status === "verifying" && (
                <div className="text-center py-8">
                  <Loader2 className="animate-spin mx-auto text-indigo-500 mb-3" size={36} />
                  <p className="text-gray-500 font-medium">Memverifikasi tautan...</p>
                </div>
              )}

              {/* Invalid token */}
              {status === "invalid" && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
                    <XCircle size={32} className="text-red-500" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-800 mb-2">Tautan Tidak Valid</h2>
                  <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                    Tautan reset ini sudah kedaluwarsa, tidak valid, atau sudah pernah digunakan. Silakan minta tautan reset baru.
                  </p>
                  <button
                    onClick={() => router.push("/")}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all"
                  >
                    Kembali ke Beranda
                  </button>
                </div>
              )}

              {/* Success */}
              {status === "success" && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
                    <CheckCircle2 size={32} className="text-green-500" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-800 mb-2">Kata Sandi Diperbarui! 🎉</h2>
                  <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                    Kata sandi Anda berhasil diubah. Silakan masuk menggunakan kata sandi baru Anda.
                  </p>
                  <button
                    onClick={() => router.push("/")}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-200"
                  >
                    Masuk Sekarang
                  </button>
                </div>
              )}

              {/* Form */}
              {(status === "valid" || status === "submitting") && (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">
                      Kata Sandi Baru <span className="font-normal text-gray-400">(min. 8 karakter)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <Lock size={18} />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Konfirmasi Kata Sandi Baru</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <Lock size={18} />
                      </div>
                      <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                      >
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Password strength hint */}
                  {formData.password && (
                    <div className="flex gap-2 items-center text-xs">
                      {[
                        { label: "8+ karakter", pass: formData.password.length >= 8 },
                        { label: "Huruf besar", pass: /[A-Z]/.test(formData.password) },
                        { label: "Angka", pass: /[0-9]/.test(formData.password) },
                      ].map(({ label, pass }) => (
                        <span
                          key={label}
                          className={`px-2 py-0.5 rounded-full font-medium ${
                            pass ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {pass ? "✓" : "·"} {label}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {status === "submitting" && (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {status === "submitting" ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-indigo-600 font-medium text-sm py-2 transition-colors"
                  >
                    <ArrowLeft size={16} />
                    Kembali ke Beranda
                  </button>
                </form>
              )}
            </div>
          </div>

          <p className="text-center text-gray-400 text-xs mt-6">
            &copy; {new Date().getFullYear()} Sobat SIBI &bull; Belajar Bahasa Isyarat Indonesia
          </p>
        </div>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={36} />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
