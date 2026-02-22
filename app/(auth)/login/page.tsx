"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { login, signInWithGoogle } from "@/app/(auth)/actions";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();
  const [rememberMe, setRememberMe] = useState(false);
  const error = searchParams.get("error");
  const email = searchParams.get("email");

  return (
    <div className="bg-surface border border-border rounded-card p-8">
      <Link href="/" className="font-display text-xl tracking-[0.05em] text-white block text-center mb-8">
        REPLAY<span className="text-green">D</span>
      </Link>
      <h1 className="font-display text-2xl tracking-wide text-center mb-6">Log in</h1>
      {error && (
        <div className="mb-4 p-3 rounded-badge bg-red/10 border border-red/30 text-red text-sm font-sans">
          {decodeURIComponent(error)}
        </div>
      )}
      <form action={(formData) => {
        formData.append("rememberMe", rememberMe ? "true" : "false");
        startTransition(() => login(formData));
      }} className="space-y-4">
        <FloatingLabelInput
          id="identifier"
          name="identifier"
          type="text"
          label="Email or Username"
          autoComplete="username"
          required
          maxLength={255}
          defaultValue={email || ""}
        />
        <div>
          <FloatingLabelInput
            id="password"
            name="password"
            type="password"
            label="Password"
            autoComplete="current-password"
            required
            maxLength={128}
            showPasswordToggle
          />
          <Link
            href="/forgot-password"
            className="block text-xs text-muted hover:text-green mt-1.5 transition-colors"
          >
            Forgot your password?
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-border2 bg-surface3 text-green focus:ring-1 focus:ring-green focus:ring-offset-0"
          />
          <label htmlFor="rememberMe" className="text-xs font-sans text-muted cursor-pointer">
            Stay signed in
          </label>
        </div>
        <Button type="submit" variant="primary" className="w-full" disabled={isPending}>
          {isPending ? "Logging in..." : "Log in"}
        </Button>
      </form>
      <div className="mt-4 pt-4 border-t border-border">
        <form action={(formData) => {
          formData.append("rememberMe", rememberMe ? "true" : "false");
          startGoogleTransition(() => signInWithGoogle(formData));
        }}>
          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={isGooglePending}
          >
            {isGooglePending ? "Connecting..." : "Continue with Google"}
          </Button>
        </form>
      </div>
      <p className="text-center text-sm text-muted mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-green hover:underline">Sign up</Link>
      </p>
    </div>
  );
}
