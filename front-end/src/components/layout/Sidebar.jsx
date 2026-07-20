"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Users,
  Bot,
  Settings,
  HelpCircle,
  Medal,
  ChevronLeft,
  Info,
  Camera,
} from "lucide-react";

const TOP_NAV_ITEMS = [
  { name: "Beranda", href: "/", icon: LayoutDashboard },
  { name: "Belajar", href: "/lessons", icon: GraduationCap },
  { name: "Kamus", href: "/kamus", icon: BookOpen },
  { name: "Kamera Pintar", href: "/live-practice", icon: Camera },
];

const BOTTOM_NAV_ITEMS = [
  { name: "Bantuan", href: "/support", icon: HelpCircle },
  { name: "Tentang", href: "/tentang", icon: Info },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login status on mount
  useEffect(() => {
    fetch("/api/user/me")
      .then(res => {
        if (res.ok) setIsLoggedIn(true);
      })
      .catch(() => { });
  }, []);

  // Auto-close on mobile initially
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsOpen(false);
    }
  }, []);

  // Hide sidebar completely on lesson detail page
  const isLessonDetail = pathname.match(/^\/lessons\/[a-f0-9-]+$/i);
  if (isLessonDetail) return null;

  return (
    <>
      {/* Spacer for Desktop & Mobile Push Effect */}
      <div className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'w-64 shrink-0' : 'w-20 shrink-0'}`} />

      {/* Sidebar Content */}
      <aside
        className={`fixed top-0 left-0 z-[55] h-screen flex flex-col bg-white border-r border-gray-200 pt-8 pb-6 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? "w-64 px-5" : "w-20 px-3"
          }`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute -right-3 top-10 bg-white border border-gray-200 rounded-md p-1 shadow-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all z-[60] flex items-center justify-center focus:outline-none"
          aria-label="Toggle Sidebar"
        >
          <ChevronLeft size={16} className={`transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} />
        </button>

        {/* Brand / Logo */}
        <div className={`flex items-center gap-3 mb-8 transition-all duration-300 overflow-hidden ${isOpen ? 'px-2' : 'px-0 justify-center'}`}>
          <div className="w-10 h-10 shrink-0 rounded-md flex items-center justify-center overflow-hidden shadow-sm bg-white">
            <img src="/images/logo.png" alt="Sobat SIBI Logo" className="w-full h-full object-contain p-1" />
          </div>
          <div className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isOpen ? 'w-32 opacity-100' : 'w-0 opacity-0'}`}>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Sobat SIBI</h1>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-2">
          {TOP_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            const requiresAuth = item.href === '/lessons' || item.href === '/kamus' || item.href === '/live-practice';

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  if (requiresAuth && !isLoggedIn) {
                    e.preventDefault();
                    window.dispatchEvent(new Event('require-login'));
                  }
                }}
                className={`relative group flex items-center gap-4 p-3 rounded-md font-medium transition-all ${isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent"
                  } ${isOpen ? 'justify-start' : 'justify-center'}`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />

                <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isOpen ? 'w-32 opacity-100' : 'w-0 opacity-0'}`}>
                  {item.name}
                </span>

                {/* Tooltip */}
                {!isOpen && (
                  <div className="absolute left-[4.5rem] px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 flex items-center border border-gray-800">
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-gray-900" />
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Navigation & Upgrade CTA */}
        <div className="mt-auto space-y-2 pt-6 border-t border-gray-200">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative group flex items-center gap-4 p-3 rounded-md font-medium transition-all ${isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent"
                  } ${isOpen ? 'justify-start' : 'justify-center'}`}
              >
                <Icon size={22} strokeWidth={2} className="shrink-0" />
                <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isOpen ? 'w-32 opacity-100' : 'w-0 opacity-0'}`}>
                  {item.name}
                </span>

                {!isOpen && (
                  <div className="absolute left-[4.5rem] px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 flex items-center border border-gray-800">
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-gray-900" />
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
