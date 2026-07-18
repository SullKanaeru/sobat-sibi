// ── app/layout.jsx (atau RootLayout) ──────────────────────────────────────────
// Contoh integrasi AuthModal + useAuth ke dalam layout utama Gestura.
// Sesuaikan dengan struktur layout project kamu.
"use client";

import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/auth/AuthModal";
import Link from "next/link";

export function GesturaHeader() {
  const {
    user,
    isModalOpen,
    closeModal,
    handleLoginSuccess,
    handleAvatarClick,
  } = useAuth();

  return (
    <>
      <header className="flex justify-between items-center mb-8">
        {/* Branding */}
        <Link href="/">
          <div>
            <h1 className="text-4xl font-black text-[#333333] tracking-tight">
              Sobat SIBI
            </h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">
              Belajar, Berlatih, Kuasai Isyarat 👋
            </p>
          </div>
        </Link>

        {/* Avatar — klik buka modal jika belum login */}
        <button
          onClick={handleAvatarClick}
          aria-label={user ? "Profil pengguna" : "Login ke Gestura"}
          className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm hover:ring-2 hover:ring-[#7B74F3] hover:ring-offset-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7B74F3]"
        >
          {user ? (
            // Sudah login — tampilkan inisial atau foto profil
            <div className="w-full h-full bg-[#7B74F3] flex items-center justify-center">
              <span className="text-white font-black text-sm">
                {user.email?.[0]?.toUpperCase() ?? "U"}
              </span>
            </div>
          ) : (
            // Belum login — tampilkan avatar placeholder
            <div className="w-full h-full bg-slate-200 flex items-center justify-center">
              <span className="text-2xl select-none">🧑</span>
            </div>
          )}
        </button>
      </header>

      {/* Modal Auth — login & register */}
      <AuthModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
}
