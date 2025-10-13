import type { HTMLAttributes } from "react";
import { clsx } from "clsx";

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export function Spinner({ className, label = "Loading", ...props }: SpinnerProps) {
  return (
    <div className={clsx("flex items-center gap-2 text-sm text-[rgb(var(--color-subtle))]", className)} {...props}>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
