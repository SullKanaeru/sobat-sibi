"use client";

import React, { useState, useEffect, useRef } from "react";
import { Edit2, Bell, Shield, Video, HardDrive, Loader2, Check, TrendingUp, CheckCircle2, Layers } from "lucide-react";

export default function SettingsPage() {
  const [cameraStatus, setCameraStatus] = useState("MEMUAT");
  const [notifPermission, setNotifPermission] = useState("MEMUAT");

  const [userData, setUserData] = useState({
    username: "",
    phone: "",
    email: "",
    profilePicture: null
  });
  const [stats, setStats] = useState({
    learnedCount: 0,
    percentage: 0,
    completedModulesCount: 0,
    totalModules: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: "camera" })
        .then((permissionObj) => {
          setCameraStatus(permissionObj.state === "granted" ? "AKTIF" : permissionObj.state === "prompt" ? "PERLU IZIN" : "DIBLOKIR");
          permissionObj.onchange = () => {
             setCameraStatus(permissionObj.state === "granted" ? "AKTIF" : permissionObj.state === "prompt" ? "PERLU IZIN" : "DIBLOKIR");
          };
        })
        .catch(() => setCameraStatus("TIDAK DIDUKUNG"));
        
      navigator.permissions.query({ name: "notifications" })
        .then((permissionObj) => {
          setNotifPermission(permissionObj.state === "granted" ? "AKTIF" : permissionObj.state === "prompt" ? "PERLU IZIN" : "DIBLOKIR");
          permissionObj.onchange = () => {
             setNotifPermission(permissionObj.state === "granted" ? "AKTIF" : permissionObj.state === "prompt" ? "PERLU IZIN" : "DIBLOKIR");
          };
        })
        .catch(() => setNotifPermission("TIDAK DIDUKUNG"));
    }
  }, []);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraStatus("AKTIF");
    } catch (err) {
      setCameraStatus("DIBLOKIR");
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission === "granted" ? "AKTIF" : "DIBLOKIR");
    }
  };

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: "Ukuran file maksimal 5MB", type: "error" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUserData(prev => ({ ...prev, profilePicture: event.target.result }));
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be selected again
    e.target.value = '';
  };

  const handleRemovePicture = () => {
    setUserData(prev => ({ ...prev, profilePicture: null }));
    setIsProfileDropdownOpen(false);
  };

  const handleEditClick = () => {
    if (userData.profilePicture) {
      setIsProfileDropdownOpen(!isProfileDropdownOpen);
    } else {
      fileInputRef.current?.click();
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [userRes, statsRes] = await Promise.all([
          fetch("/api/user/me"),
          fetch("/api/user/stats")
        ]);
        if (userRes.ok) {
          const data = await userRes.json();
          setUserData(data);
        }
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error("Gagal mengambil data profil", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ text: "", type: "" });
    try {
      const res = await fetch("/api/user/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Profil berhasil diperbarui!", type: "success" });
        setUserData(data.user);
        window.dispatchEvent(new Event("userProfileUpdated"));
      } else {
        setMessage({ text: data.error || "Gagal memperbarui profil", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Terjadi kesalahan sistem", type: "error" });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  return (
    <div className="w-full animate-in fade-in duration-500">
      <header className="mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Pengaturan</h2>
        <p className="text-gray-500 mt-1 text-sm md:text-base">Kelola akun, preferensi, dan privasi Anda.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-7xl mx-auto pb-6">
        {/* Section 0: Statistik Kemajuan */}
        <section className="lg:col-span-12 bg-white border border-gray-200 shadow-sm rounded-lg p-5 md:p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-md">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Statistik Kemajuan</h3>
              <p className="text-gray-500 text-xs font-medium">Ringkasan perjalanan belajar Anda</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-700 to-blue-800 p-5 rounded-lg shadow-sm text-white flex flex-col justify-between min-h-[110px] relative overflow-hidden group">
              <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-110 transition-transform">
                <CheckCircle2 size={80} />
              </div>
              <p className="text-blue-100 font-bold text-xs tracking-wider uppercase mb-1 relative z-10">Total Isyarat Dikuasai</p>
              {isLoading ? (
                <div className="h-8 w-16 bg-blue-400/50 rounded animate-pulse relative z-10"></div>
              ) : (
                <h4 className="text-3xl font-black relative z-10">{stats.learnedCount}</h4>
              )}
            </div>

            <div className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm flex flex-col justify-between min-h-[110px]">
              <p className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-1">Penguasaan Kurikulum</p>
              {isLoading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-2xl font-black text-gray-900">{stats.percentage}%</h4>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-700 rounded-full" style={{ width: `${stats.percentage}%` }}></div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm flex flex-col justify-between min-h-[110px] relative overflow-hidden">
              <div className="absolute right-[-10px] bottom-[-10px] opacity-5 text-gray-900">
                <Layers size={80} />
              </div>
              <p className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-1 relative z-10">Modul Selesai</p>
              {isLoading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse relative z-10"></div>
              ) : (
                <div className="flex items-baseline gap-1 relative z-10">
                  <h4 className="text-3xl font-black text-gray-900">{stats.completedModulesCount}</h4>
                  <span className="text-gray-400 font-bold text-sm">/ {stats.totalModules || 0}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 1: Profil & Akun */}
        <section className="lg:col-span-12 bg-white border border-gray-200 shadow-sm rounded-lg p-5 md:p-8 flex flex-col gap-4 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 border-b border-gray-100 pb-4 relative z-30">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-blue-50 bg-gray-50 relative">
                {userData.profilePicture ? (
                  <img src={userData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-700 text-3xl font-bold">
                    {userData.username ? userData.username.substring(0, 2).toUpperCase() : "JA"}
                  </div>
                )}
              </div>
              <button
                onClick={handleEditClick}
                className="absolute bottom-0 right-0 bg-blue-700 text-white p-1.5 rounded-md shadow-sm hover:scale-110 transition-transform focus:outline-none z-10"
              >
                <Edit2 size={14} />
              </button>

              {isProfileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)}></div>
                  <div className="absolute top-20 left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                    <button onClick={() => { setIsProfileDropdownOpen(false); fileInputRef.current?.click(); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">
                      Ubah foto profil
                    </button>
                    <button onClick={handleRemovePicture} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium">
                      Hapus foto profil
                    </button>
                  </div>
                </>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Profil & Akun</h3>
              <p className="text-gray-500 text-xs font-medium">Perbarui detail pribadi Anda</p>
            </div>
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.type === 'success' && <Check size={18} />}
              {message.text}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="animate-spin text-blue-700" size={32} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2 relative z-10">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Nama Pengguna</label>
                <input
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                  type="text"
                  value={userData.username}
                  onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Nomor Telepon</label>
                <input
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                  type="tel"
                  value={userData.phone}
                  onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                />
              </div>
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Alamat Surel</label>
                <input
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="mt-4 p-6 bg-gray-50 border border-dashed border-gray-200 rounded-md relative z-10">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-2">
              <span className="text-sm font-bold text-blue-700">Pengaturan Keamanan</span>
              <button className="text-blue-700 text-sm font-bold hover:underline focus:outline-none self-start md:self-auto">Ubah Kata Sandi</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-50 pointer-events-none">
              <input className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-md text-sm font-medium" placeholder="Kata Sandi Lama" type="password" />
              <input className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-md text-sm font-medium" placeholder="Kata Sandi Baru" type="password" />
              <input className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-md text-sm font-medium" placeholder="Konfirmasi Kata Sandi" type="password" />
            </div>
          </div>
        </section>

        {/* Section 2: Notifikasi & AI */}
        <section className="lg:col-span-6 bg-white border border-gray-200 shadow-sm rounded-lg p-5 md:p-8 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-md">
              <Bell size={20} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">AI & Notifikasi</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl">
              <div>
                <p className="font-bold text-gray-900 text-sm">Pengingat Belajar</p>
                <p className="text-xs text-gray-500 mt-1">Dapatkan pengingat saat Anda belum berlatih hari ini.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-700 shadow-inner"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl">
              <div>
                <p className="font-bold text-gray-900 text-sm">Pembaruan Kosa Kata</p>
                <p className="text-xs text-gray-500 mt-1">Pemberitahuan saat ada modul atau kata isyarat baru.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-700 shadow-inner"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl">
              <div>
                <p className="font-bold text-gray-900 text-sm">Pencapaian (Streak)</p>
                <p className="text-xs text-gray-500 mt-1">Rayakan pencapaian belajar Anda yang berturut-turut.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-700 shadow-inner"></div>
              </label>
            </div>
          </div>

          <div className="space-y-4 mt-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Persona Asisten AI</label>
            <div className="space-y-3">
              <label className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-md cursor-pointer hover:border-blue-200 hover:bg-blue-50/50 transition-all group">
                <input type="radio" name="persona" className="w-4 h-4 text-blue-700 focus:ring-blue-500 border-gray-300" />
                <div>
                  <p className="font-bold text-gray-900 text-sm group-hover:text-blue-700 transition-colors">Formal & Profesional</p>
                  <p className="text-xs text-gray-500 mt-1">Umpan balik yang sopan, terstruktur, dan fokus.</p>
                </div>
              </label>
              <label className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-md cursor-pointer group shadow-sm">
                <input type="radio" name="persona" className="w-4 h-4 text-blue-700 focus:ring-blue-500 border-gray-300" defaultChecked />
                <div>
                  <p className="font-bold text-blue-700 text-sm">Kasual & Menyemangati</p>
                  <p className="text-xs text-gray-500 mt-1">Ramah, menyemangati, dan mendukung penuh.</p>
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* Section 3: Privasi & Perangkat */}
        <section className="lg:col-span-6 bg-white border border-gray-200 shadow-sm rounded-lg p-5 md:p-8 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-700 rounded-md">
                <Shield size={20} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Privasi & Perangkat</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-gray-50 border border-gray-200 rounded-md flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="text-gray-400">
                    <Video size={24} />
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wider ${
                    cameraStatus === "AKTIF" ? "bg-green-100 text-green-700" : 
                    cameraStatus === "MEMUAT" ? "bg-gray-200 text-gray-600" : 
                    "bg-red-100 text-red-700"
                  }`}>
                    {cameraStatus}
                  </span>
                </div>
                <p className="font-bold text-gray-900 text-sm mt-2">Izin Kamera</p>
                {cameraStatus !== "AKTIF" && (
                  <button onClick={requestCameraPermission} className="text-xs text-blue-700 hover:underline font-semibold mt-1 self-start">
                    Minta Izin Akses
                  </button>
                )}
              </div>
              <div className="p-5 bg-gray-50 border border-gray-200 rounded-md flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="text-gray-400">
                    <Bell size={24} />
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wider ${
                    notifPermission === "AKTIF" ? "bg-green-100 text-green-700" : 
                    notifPermission === "MEMUAT" ? "bg-gray-200 text-gray-600" : 
                    "bg-red-100 text-red-700"
                  }`}>
                    {notifPermission}
                  </span>
                </div>
                <p className="font-bold text-gray-900 text-sm mt-2">Notifikasi Sistem</p>
                {notifPermission !== "AKTIF" && (
                  <button onClick={requestNotificationPermission} className="text-xs text-blue-700 hover:underline font-semibold mt-1 self-start">
                    Izinkan Notifikasi
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl">
              <div>
                <p className="font-bold text-gray-900 text-sm">Berbagi Data Anonim</p>
                <p className="text-xs text-gray-500 mt-1 max-w-[280px]">Bantu kami melatih AI agar lebih akurat dengan membagikan metrik gerakan yang sering gagal (sepenuhnya anonim, tanpa merekam video/wajah).</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-700 shadow-inner"></div>
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 border-t border-gray-100 pt-6 mt-4">
            <button className="flex-1 py-3.5 rounded-md font-bold text-sm bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors focus:outline-none">
              Kembalikan ke Awal
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="flex-1 py-3.5 rounded-md font-bold text-sm bg-blue-700 text-white shadow-sm hover:bg-blue-800 active:scale-[0.98] transition-all focus:outline-none disabled:bg-blue-400 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
