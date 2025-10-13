import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth";
import { AuthProvider } from "@/components/providers/auth-provider";
import { TopNav } from "@/components/layout/top-nav";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUserProfile();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <AuthProvider initialUser={user}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <TopNav user={user} />
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      </div>
    </AuthProvider>
  );
}
