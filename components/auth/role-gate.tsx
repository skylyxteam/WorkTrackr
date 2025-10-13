"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import type { UserRole } from "@/types";

export function RoleGate({ allow, children, fallback }: { allow: UserRole | UserRole[]; children: ReactNode; fallback?: ReactNode }) {
  const { user } = useAuth();
  const allowed = Array.isArray(allow) ? allow : [allow];

  if (!user) {
    return fallback ?? null;
  }

  if (!allowed.includes(user.role)) {
    return fallback ?? null;
  }

  return <>{children}</>;
}
