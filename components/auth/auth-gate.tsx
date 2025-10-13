"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Spinner } from "@/components/ui/spinner";

export function AuthGate({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return fallback ?? (
      <div className="flex min-h-[200px] items-center justify-center">
        <Spinner label="Loading" />
      </div>
    );
  }

  if (!user) {
    return fallback ?? null;
  }

  return <>{children}</>;
}
