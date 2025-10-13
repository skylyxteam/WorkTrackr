"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";

export function SignOutButton() {
  const { signOut, loading } = useAuth();

  return (
    <Button data-testid="sign-out-button" variant="ghost" onClick={signOut} loading={loading} className="text-sm font-medium">
      <LogOut className="h-4 w-4" />
      <span>Sign out</span>
    </Button>
  );
}
