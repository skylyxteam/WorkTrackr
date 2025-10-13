"use client";

import { useEffect } from "react";
import { clsx } from "clsx";

const variants = {
  success: "bg-green-600 text-white",
  error: "bg-red-600 text-white",
  info: "bg-slate-900 text-white",
} as const;

export interface ToastProps {
  open: boolean;
  message: string;
  variant?: keyof typeof variants;
  duration?: number;
  onClose?: () => void;
}

export function Toast({ open, message, variant = "info", duration = 4000, onClose }: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => onClose?.(), duration);
    return () => window.clearTimeout(timeout);
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div
        className={clsx(
          "pointer-events-auto flex items-center gap-3 rounded-full px-4 py-2 shadow-lg",
          variants[variant],
        )}
        role="status"
        aria-live="polite"
      >
        <span className="text-sm font-medium">{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold uppercase tracking-wide text-white/80 hover:text-white"
        >
          Close
        </button>
      </div>
    </div>
  );
}
