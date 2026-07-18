"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Mail, Lock, User, Phone, Eye, EyeOff, ArrowLeft, Send } from "lucide-react";
import { useToast, ToastContainer } from "@/components/ui/Toast";

// Client-side validation helpers
function validateLoginForm(email, password) {
  if (!email || !password) return { ok: false, title: "Kolom belum lengkap", message: "Email dan kata sandi harus diisi." };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return { ok: false, title: "Format email salah", message: "Masukkan alamat email yang valid, contoh: nama@email.com" };
  return { ok: true };
}

function validateRegisterForm({ username, phone, email, password, confirmPassword }) {
  if (!username || !phone || !email || !password || !confirmPassword)
    return { ok: false, title: "Kolom belum lengkap", message: "Semua kolom wajib diisi." };
  if (username.trim().length < 3)
    return { ok: false, title: "Nama terlalu pendek", message: "Nama pengguna minimal 3 karakter." };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return { ok: false, title: "Format email salah", message: "Masukkan alamat email yang valid, contoh: nama@email.com" };
  const phoneClean = phone.replace(/[\s\-().]/g, "");
  if (!/^(\+62|62|0)[0-9]{8,13}$/.test(phoneClean))
    return { ok: false, title: "Nomor telepon tidak valid", message: "Gunakan format nomor Indonesia, contoh: 0812-3456-7890." };
  if (password.length < 8)
    return { ok: false, title: "Kata sandi terlalu pendek", message: "Kata sandi minimal 8 karakter." };
  if (password !== confirmPassword)
    return { ok: false, title: "Kata sandi tidak cocok", message: "Konfirmasi kata sandi tidak sesuai dengan kata sandi yang dimasukkan." };
  return { ok: true };
}

// ── Forgot Password Sub-form ──────────────────────────────────────────────────
function ForgotPasswordView({ onBack, toast }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      toast.error("Email wajib diisi", "Masukkan alamat email yang terdaftar.");
      return;
    }
    if (!emailRegex.test(email)) {
      toast.error("Format email salah", "Masukkan alamat email yang valid.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        const errMap = {
          EMAIL_SEND_FAILED: ["Gagal mengirim email", "Konfigurasi email server belum lengkap. Hubungi admin."],
          SERVER_ERROR: ["Terjadi kesalahan", data.message],
        };
        const [title, message] = errMap[data.error] || ["Gagal", data.message || "Terjadi kesalahan."];
        toast.error(title, message);
        return;
      }
      setSent(true);
    } catch {
      toast.error("Tidak dapat terhubung", "Periksa koneksi internet Anda dan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Send size={28} className="text-green-600" />
        </div>
        <h2 className="text-xl font-black text-gray-800 mb-2">Email Terkirim!</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Jika email <strong className="text-indigo-600">{email}</strong> terdaftar, kami sudah mengirimkan tautan reset kata sandi. Periksa kotak masuk dan folder spam Anda.
        </p>
        <p className="text-gray-400 text-xs mb-6">Tautan berlaku selama <strong>1 jam</strong>.</p>
        <button
          onClick={onBack}
          className="w-full flex items-center justify-center gap-2 text-indigo-600 hover:text-indigo-800 font-bold text-sm py-2 transition-colors focus:outline-none"
        >
          <ArrowLeft size={16} />
          Kembali ke Login
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-gray-400 hover:text-indigo-600 text-sm font-medium transition-colors focus:outline-none mb-6"
      >
        <ArrowLeft size={15} />
        Kembali ke Login
      </button>

      <div className="mb-6">
        <h2 className="text-2xl font-black text-indigo-700 tracking-tight mb-1">Lupa Kata Sandi?</h2>
        <p className="text-gray-500 text-sm">Masukkan email Anda dan kami akan mengirimkan tautan reset.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Alamat Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <Mail size={18} />
            </div>
            <input
              type="email"
              placeholder="contoh@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
              autoFocus
            />
          </div>
        </div>

        <div className="pt-1">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? "Mengirim..." : "Kirim Tautan Reset"}
          </button>
        </div>
      </form>
    </>
  );
}

// ── Main AuthModal ────────────────────────────────────────────────────────────
export default function AuthModal({ isOpen, onClose, initialMode = "login", onLoginSuccess }) {
  // mode: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState(initialMode);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { toasts, dismiss, toast } = useToast();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => { setMode(initialMode); }, [initialMode, isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
  }, [isOpen]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setFormData({ username: "", phone: "", email: "", password: "", confirmPassword: "" });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "register") {
      const v = validateRegisterForm(formData);
      if (!v.ok) { toast.error(v.title, v.message); return; }
    } else {
      const v = validateLoginForm(formData.email, formData.password);
      if (!v.ok) { toast.error(v.title, v.message); return; }
    }

    setLoading(true);
    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formData.username,
            phone: formData.phone,
            email: formData.email,
            password: formData.password,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          const errorMap = {
            FIELDS_REQUIRED: ["Kolom belum lengkap", data.message],
            USERNAME_TOO_SHORT: ["Nama pengguna terlalu pendek", data.message],
            EMAIL_INVALID: ["Format email salah", data.message],
            PHONE_INVALID: ["Nomor telepon tidak valid", data.message],
            PASSWORD_TOO_SHORT: ["Kata sandi terlalu pendek", data.message],
            EMAIL_TAKEN: ["Email sudah digunakan", data.message],
            SERVER_ERROR: ["Gagal terhubung ke server", data.message],
          };
          const [title, message] = errorMap[data.error] || ["Pendaftaran gagal", data.message || "Terjadi kesalahan."];
          toast.error(title, message);
          return;
        }

        toast.success("Pendaftaran berhasil! 🎉", "Akun Anda sudah dibuat. Ayo mulai belajar bahasa isyarat!", { duration: 6000 });
        if (onLoginSuccess) onLoginSuccess();
        onClose();
        window.location.reload();

      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
        });
        let data;
        try {
          data = await res.json();
        } catch {
          data = { error: "SERVER_ERROR", message: "Gagal terhubung ke server atau respons tidak valid." };
        }

        if (!res.ok) {
          const errorMap = {
            FIELDS_REQUIRED: ["Kolom belum lengkap", data.message],
            EMAIL_INVALID: ["Format email salah", data.message],
            EMAIL_NOT_FOUND: ["Email tidak ditemukan", data.message],
            PASSWORD_WRONG: ["Kata sandi salah", data.message],
            SERVER_ERROR: ["Gagal terhubung ke server", data.message],
          };
          const [title, message] = errorMap[data.error] || ["Masuk gagal", data.message || "Terjadi kesalahan."];
          toast.error(title, message);
          return;
        }

        toast.success("Selamat datang kembali!", "Anda berhasil masuk.");
        if (onLoginSuccess) onLoginSuccess();
        onClose();
        window.location.reload();
      }
    } catch {
      toast.error("Tidak dapat terhubung", "Periksa koneksi internet Anda dan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-0">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 overflow-hidden transform transition-all">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-indigo-50 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full bg-blue-50 blur-2xl pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all focus:outline-none z-20"
          >
            <X size={20} />
          </button>

          <div className="relative z-10">
            {/* ── Forgot Password view ── */}
            {mode === "forgot" ? (
              <ForgotPasswordView onBack={() => switchMode("login")} toast={toast} />
            ) : (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-black text-indigo-700 tracking-tight mb-2">
                    {mode === "login" ? "Selamat Datang!" : "Buat Akun Baru"}
                  </h2>
                  <p className="text-gray-500 text-sm font-medium">
                    {mode === "login"
                      ? "Masuk untuk melanjutkan ke Sobat SIBI"
                      : "Bergabunglah dan mulai belajar bahasa isyarat hari ini"}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {mode === "register" && (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Nama Pengguna</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><User size={18} /></div>
                          <input type="text" placeholder="Minimal 3 karakter" value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Nomor Telepon</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Phone size={18} /></div>
                          <input type="tel" placeholder="0812-3456-7890" value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium" />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Surel</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Mail size={18} /></div>
                      <input type="email" placeholder="contoh@email.com" value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-bold text-gray-700 ml-1">
                        Kata Sandi{mode === "register" && <span className="font-normal text-gray-400 ml-1">(min. 8 karakter)</span>}
                      </label>
                      {mode === "login" && (
                        <button
                          type="button"
                          onClick={() => switchMode("forgot")}
                          className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold transition-colors focus:outline-none"
                        >
                          Lupa kata sandi?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Lock size={18} /></div>
                      <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {mode === "register" && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Konfirmasi Kata Sandi</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Lock size={18} /></div>
                        <input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium" />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none">
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button type="submit" disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] flex items-center justify-center gap-2">
                      {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      {loading ? "Memproses..." : (mode === "login" ? "Masuk Sekarang" : "Daftar Sekarang")}
                    </button>
                  </div>
                </form>

                <div className="mt-6 text-center text-sm font-medium text-gray-600">
                  {mode === "login" ? (
                    <p>Belum punya akun?{" "}
                      <button onClick={() => switchMode("register")} className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors focus:outline-none">Daftar di sini</button>
                    </p>
                  ) : (
                    <p>Sudah punya akun?{" "}
                      <button onClick={() => switchMode("login")} className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors focus:outline-none">Masuk di sini</button>
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>,
    document.body
  );
}
