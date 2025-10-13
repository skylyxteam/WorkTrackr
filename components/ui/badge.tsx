import type { HTMLAttributes } from "react";
import { clsx } from "clsx";

const variants = {
  neutral: "bg-[rgb(var(--color-muted))]/30 text-[rgb(var(--color-subtle))]",
  success: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-100",
  danger: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200",
} as const;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
}

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
