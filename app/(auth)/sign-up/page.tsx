import { SignUpForm } from "@/components/auth/sign-up-form";
import { ShieldCheck } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">Create an account</h1>
        <p className="text-sm text-[rgb(var(--color-subtle))]">Join WorkTrackr to start logging time for your team.</p>
      </header>

      <SignUpForm />

      <footer className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-3 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
        <ShieldCheck className="h-4 w-4" /> Accounts are secured by Firebase Authentication
      </footer>
    </div>
  );
}
