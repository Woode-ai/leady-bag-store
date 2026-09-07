// src/components/Toast.tsx
"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 start-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const isRtl = document.documentElement.dir === "rtl";
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 ${
                toast.type === "success"
                  ? "bg-emerald-50/95 border-emerald-200 text-emerald-900"
                  : toast.type === "error"
                  ? "bg-rose-50/95 border-rose-200 text-rose-900"
                  : toast.type === "warning"
                  ? "bg-amber-50/95 border-amber-200 text-amber-900"
                  : "bg-blue-50/95 border-blue-200 text-blue-900"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {toast.type === "success" && (
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                )}
                {toast.type === "error" && (
                  <AlertCircle size={18} className="text-rose-600 shrink-0" />
                )}
                {toast.type === "warning" && (
                  <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                )}
                {toast.type === "info" && (
                  <Info size={18} className="text-blue-600 shrink-0" />
                )}
                <span className="text-xs font-semibold leading-relaxed truncate">
                  {toast.message}
                </span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (message: string) => {
        if (typeof window !== "undefined") {
          console.log("Toast fallback:", message);
        }
      },
    };
  }
  return context;
}
