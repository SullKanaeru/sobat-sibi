// ── hooks/useAuth.js ───────────────────────────────────────────────────────────
"use client";

import { useState, useCallback } from "react";

/**
 * useAuth — manajemen state auth sederhana untuk frontend.
 * Ganti implementasi login/logout dengan auth backend sesungguhnya.
 */
export function useAuth() {
  const [user, setUser] = useState(null); // null = belum login
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const handleLoginSuccess = useCallback((userData) => {
    setUser(userData);
    setIsModalOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
  }, []);

  // Klik avatar: jika belum login → buka modal; jika sudah → bisa tampilkan menu
  const handleAvatarClick = useCallback(() => {
    if (!user) openModal();
    // Jika sudah login, kamu bisa extend ini untuk dropdown profile
  }, [user, openModal]);

  return {
    user,
    isModalOpen,
    openModal,
    closeModal,
    handleLoginSuccess,
    handleLogout,
    handleAvatarClick,
  };
}
