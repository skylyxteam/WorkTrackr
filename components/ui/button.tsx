"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary: "bg-blue-600 text-white hover:bg-blue-500",
  outline: "border border-[rgb(var(--color-border))] bg-transparent hover:bg-[rgb(var(--color-brand-muted))]/30",
  subtle: "bg-[rgb(var(--color-brand-muted))]/30 text-blue-700 hover:bg-[rgb(var(--color-brand-muted))]/50",
  ghost: "hover:bg-[rgb(var(--color-brand-muted))]/30",
  danger: "bg-red-600 text-white hover:bg-red-500",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", loading = false, icon, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(baseStyles, variants[variant], className)}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        )}
        {!loading && icon}
        <span>{children}</span>
      </button>
    );
  },
);

Button.displayName = "Button";
