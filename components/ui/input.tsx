"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { clsx } from "clsx";

const baseStyles =
  "w-full rounded-lg border border-[rgb(var(--color-border))] bg-white px-3 py-2 text-sm text-[rgb(var(--color-foreground))] shadow-sm transition placeholder:text-[rgb(var(--color-subtle))] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[rgb(var(--color-surface))]";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return <input ref={ref} className={clsx(baseStyles, className)} {...props} />;
});

Input.displayName = "Input";
