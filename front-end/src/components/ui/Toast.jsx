// src/components/ui/Toast.jsx
"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, X, Info, AlertTriangle } from "lucide-react";

function ToastItem({ id, type, title, message, onDismiss, duration = 4500 }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const enterTimer = setTimeout(() => setVisible(true), 10);
    const dismissTimer = setTimeout(() => handleDismiss(), duration);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, []);

  const handleDismiss = () => {
    setLeaving(true);
    setTimeout(() => onDismiss(id), 350);
  };

  const config = {
    success: {
      icon: React.createElement(CheckCircle2, { size: 20, className: "text-green-500 shrink-0 mt-0.5" }),
      border: "border-green-200",
      bg: "bg-white",
      titleColor: "text-green-700",
      bar: "bg-green-500",
    },
    error: {
      icon: React.createElement(XCircle, { size: 20, className: "text-red-500 shrink-0 mt-0.5" }),
      border: "border-red-200",
      bg: "bg-white",
      titleColor: "text-red-700",
      bar: "bg-red-500",
    },
    warning: {
      icon: React.createElement(AlertTriangle, { size: 20, className: "text-amber-500 shrink-0 mt-0.5" }),
      border: "border-amber-200",
      bg: "bg-white",
      titleColor: "text-amber-700",
      bar: "bg-amber-500",
    },
    info: {
      icon: React.createElement(Info, { size: 20, className: "text-blue-500 shrink-0 mt-0.5" }),
      border: "border-blue-200",
      bg: "bg-white",
      titleColor: "text-blue-700",
      bar: "bg-blue-500",
    },
  };

  const c = config[type] || config.info;

  return (
    <div
      className={[
        "relative w-full max-w-sm overflow-hidden rounded-2xl border shadow-xl shadow-black/10",
        "transition-all duration-300 ease-in-out",
        c.bg, c.border,
        visible && !leaving ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
      ].join(" ")}
      role="alert"
    >
      <div className={"absolute top-0 left-0 right-0 h-1 " + c.bar} />
      <div className="flex items-start gap-3 p-4 pt-5">
        {c.icon}
        <div className="flex-1 min-w-0">
          {title && React.createElement("p", { className: "font-bold text-sm leading-tight " + c.titleColor }, title)}
          {message && React.createElement("p", { className: "text-gray-600 text-sm mt-0.5 leading-relaxed" }, message)}
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-all shrink-0 focus:outline-none"
        >
          {React.createElement(X, { size: 14 })}
        </button>
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    React.createElement("div",
      { className: "fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 items-end w-full max-w-sm pointer-events-none", "aria-live": "polite" },
      toasts.map((toast) =>
        React.createElement("div", { key: toast.id, className: "pointer-events-auto w-full" },
          React.createElement(ToastItem, { ...toast, onDismiss })
        )
      )
    ),
    document.body
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const dismiss = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const show = ({ type = "info", title, message, duration }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
    return id;
  };

  return {
    toasts,
    dismiss,
    toast: {
      show,
      success: (title, message, opts) => show({ type: "success", title, message, ...opts }),
      error: (title, message, opts) => show({ type: "error", title, message, ...opts }),
      warning: (title, message, opts) => show({ type: "warning", title, message, ...opts }),
      info: (title, message, opts) => show({ type: "info", title, message, ...opts }),
    },
  };
}
