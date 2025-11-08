import { SignInForm } from "@/components/auth/sign-in-form";
import { Clock, ShieldCheck } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 text-center">
        <span className="mx-auto inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
          <Clock className="h-3.5 w-3.5" /> ClockUp
        </span>
        <h1 className="text-2xl font-semibold">Sign in to track your time</h1>
        <p className="text-sm text-[rgb(var(--color-subtle))]">
          Welcome back! Log your hours, submit notes, and stay aligned with your team.
        </p>
      </header>

      <SignInForm />

      <footer className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-3 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
        <ShieldCheck className="h-4 w-4" /> SSO and email sign-in secured by Firebase Authentication
      </footer>
    </div>
  );
}
