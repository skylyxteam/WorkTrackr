import type { HTMLAttributes } from "react";
import { clsx } from "clsx";

const variantClasses = {
  info: "border-blue-200 bg-blue-50 text-blue-700",
  success: "border-green-200 bg-green-50 text-green-700",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
  danger: "border-red-200 bg-red-50 text-red-700",
} as const;

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof variantClasses;
}

export function Alert({ className, variant = "info", ...props }: AlertProps) {
  return (
    <div
      role="status"
      className={clsx(
        "rounded-lg border px-4 py-3 text-sm",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
