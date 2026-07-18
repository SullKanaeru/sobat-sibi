"use client";
import React, { useState, useEffect, useRef } from "react";
import { User, Settings, LogOut, LogIn } from "lucide-react";
import Link from "next/link";
import AuthModal from "@/components/auth/AuthModal";
import { useToast, ToastContainer } from "@/components/ui/Toast";

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Simulasi state login
  const [userData, setUserData] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const { toasts, dismiss, toast } = useToast();

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cek status login saat pertama kali dimuat
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user/me");
        if (res.ok) {
          const data = await res.json();
          setUserData(data);
          setIsLoggedIn(true);
        }
      } catch (err) {
        console.error("Gagal mengecek status login", err);
      }
    };

    fetchUser();

    const handleRequireLogin = () => {
      toast.warning("Akses Ditolak", "Anda harus login terlebih dahulu untuk mengakses fitur ini!");
      setIsAuthModalOpen(true);
    };

    window.addEventListener("userProfileUpdated", fetchUser);
    window.addEventListener("require-login", handleRequireLogin);
    
    return () => {
      window.removeEventListener("userProfileUpdated", fetchUser);
      window.removeEventListener("require-login", handleRequireLogin);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    setIsLoggedIn(false);
    setIsDropdownOpen(false);
    window.location.reload();
  };

  return (
    <div className="top-4 z-[40] px-4 md:px-8 mb-6 mt-2">
      <header className="h-16 w-full bg-white/80 backdrop-blur-md border border-gray-200 shadow-sm rounded-md flex items-center justify-between px-6 transition-all duration-300">
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-black text-gray-900 tracking-tight hover:text-blue-700 transition-colors">
            Sobat SIBI
          </Link>
        </div>

        <div className="relative" ref={dropdownRef}>
          {/* Profile Picture Button */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-all active:scale-95 focus:outline-none border border-transparent hover:border-gray-300 overflow-hidden"
          >
            {userData?.profilePicture ? (
              <img src={userData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={20} strokeWidth={2.5} />
            )}
          </button>

          {/* Dropdown Menu */}
          <div
            className={`absolute right-0 mt-3 w-52 bg-white rounded-md shadow-lg border border-gray-100 py-2 z-50 overflow-hidden transition-all duration-200 origin-top-right ${isDropdownOpen
              ? "transform scale-100 opacity-100 visible"
              : "transform scale-95 opacity-0 invisible"
              }`}
          >
            {isLoggedIn ? (
              <>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <Settings size={18} />
                  Pengaturan Profile
                </Link>
                <div className="h-px bg-gray-100 my-1 mx-2" />
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                  Keluar Akun
                </button>
              </>
            ) : (
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                onClick={() => {
                  setIsAuthModalOpen(true);
                  setIsDropdownOpen(false);
                }}
              >
                <LogIn size={18} />
                Masuk
              </button>
            )}
          </div>
        </div>

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode="login"
          onLoginSuccess={() => {
            setIsLoggedIn(true);
            window.location.reload();
          }}
        />
      </header>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
