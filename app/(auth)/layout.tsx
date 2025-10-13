import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100 px-4 py-16 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md rounded-3xl border border-[rgb(var(--color-border))] bg-white/90 p-10 shadow-xl backdrop-blur dark:bg-[rgb(var(--color-surface))]/90">
        {children}
      </div>
    </div>
  );
}
