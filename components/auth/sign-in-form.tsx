"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmail, signInWithGoogle, finalizeRedirectSignIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Eye, EyeOff } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export function SignInForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    try {
      await signInWithEmail(values.email, values.password);
      window.location.href = "/dashboard";
    } catch (error) {
      console.error(error);
      setMessage("Unable to sign in with those credentials.");
    }
  });

  const handleGoogle = async () => {
    setMessage(null);
    setLoadingGoogle(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error(error);
      setMessage("Google sign-in failed. Please try again.");
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleSignUp = () => {
    // Navigate to a sign-up page. If you have a different route, update this path.
    window.location.href = "/sign-up";
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <form data-testid="sign-in-form" onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            data-testid="sign-in-email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              data-testid="sign-in-password"
              type={showPassword ? "text" : "password"}
              placeholder="********"
              autoComplete="current-password"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
        </div>

        {message && (
          <Alert data-testid="sign-in-error" variant="danger">
            {message}
          </Alert>
        )}

        <Button
          type="submit"
          data-testid="sign-in-submit"
          loading={isSubmitting}
          className="w-full"
        >
          Sign in
        </Button>
      </form>

      <div className="relative flex items-center justify-center">
        <span className="text-xs uppercase tracking-wide text-[rgb(var(--color-subtle))]">or continue with</span>
      </div>

      <Button
        variant="outline"
        type="button"
        onClick={handleGoogle}
        loading={loadingGoogle}
        className="w-full"
        data-testid="sign-in-google"
      >
        <span className="flex items-center gap-2">Google</span>
      </Button>

      <Button
        variant="subtle"
        type="button"
        onClick={handleSignUp}
        className="w-full"
        data-testid="sign-up"
      >
        Create an account
      </Button>
    </div>
  );
}
