"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signup, checkUsername } from "@/app/(auth)/actions";

export default function SignupPage() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [isPending, startTransition] = useTransition();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const error = searchParams.get("error");
  const message = searchParams.get("message");

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    const trimmed = value.trim();
    
    if (trimmed.length === 0) {
      setUsernameStatus("idle");
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(trimmed)) {
      setUsernameStatus("invalid");
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      return;
    }

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce the check
    debounceTimer.current = setTimeout(async () => {
      setUsernameStatus("checking");
      const { available } = await checkUsername(trimmed);
      setUsernameStatus(available ? "available" : "taken");
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div className="bg-surface border border-border rounded-card p-8">
      <Link href="/" className="font-display text-xl tracking-[0.05em] text-white block text-center mb-8">
        REPLAY<span className="text-green">D</span>
      </Link>
      <h1 className="font-display text-2xl tracking-wide text-center mb-6">Sign up</h1>
      {error && (
        <div className="mb-4 p-3 rounded-badge bg-red/10 border border-red/30 text-red text-sm font-sans">
          {decodeURIComponent(error)}
        </div>
      )}
      {message && (
        <div className="mb-4 p-3 rounded-badge bg-green-dim border border-green/30 text-green text-sm font-sans">
          {decodeURIComponent(message)}
        </div>
      )}
      <form action={(formData) => startTransition(() => signup(formData))} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-xs font-mono uppercase tracking-wider text-muted mb-1">
            Username
          </label>
          <input
            id="username"
            type="text"
            name="username"
            autoComplete="username"
            required
            minLength={3}
            maxLength={30}
            pattern="[a-zA-Z0-9_]{3,30}"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            className="w-full rounded-badge border border-border2 bg-surface3 px-3 py-2 text-sm font-sans text-white placeholder:text-muted2 focus:outline-none focus:ring-1 focus:ring-green"
            placeholder="johndoe"
          />
          <div className="mt-1 min-h-[16px]">
            {usernameStatus === "checking" && (
              <p className="text-xs text-muted">Checking...</p>
            )}
            {usernameStatus === "available" && (
              <p className="text-xs text-green">✓ Username available</p>
            )}
            {usernameStatus === "taken" && (
              <p className="text-xs text-red">✗ Username already taken</p>
            )}
            {usernameStatus === "invalid" && username.trim().length > 0 && (
              <p className="text-xs text-red">3-30 characters, letters, numbers, and underscores only</p>
            )}
            {usernameStatus === "idle" && username.trim().length === 0 && (
              <p className="text-xs text-muted2">3-30 characters</p>
            )}
          </div>
        </div>
        <div>
          <label htmlFor="email" className="block text-xs font-mono uppercase tracking-wider text-muted mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            autoComplete="email"
            required
            className="w-full rounded-badge border border-border2 bg-surface3 px-3 py-2 text-sm font-sans text-white placeholder:text-muted2 focus:outline-none focus:ring-1 focus:ring-green"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-xs font-mono uppercase tracking-wider text-muted mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="w-full rounded-badge border border-border2 bg-surface3 px-3 py-2 text-sm font-sans text-white placeholder:text-muted2 focus:outline-none focus:ring-1 focus:ring-green"
          />
          <p className="text-xs text-muted2 mt-1">At least 8 characters</p>
        </div>
        <Button type="submit" variant="primary" className="w-full" disabled={isPending || usernameStatus === "taken" || usernameStatus === "invalid" || usernameStatus === "checking"}>
          {isPending ? "Signing up..." : "Sign up"}
        </Button>
      </form>
      <div className="mt-4 pt-4 border-t border-border">
        <button
          type="button"
          className="w-full rounded-btn px-4 py-2 text-sm font-sans bg-transparent border border-border text-white hover:border-border2 hover:bg-surface3 transition-colors"
        >
          Continue with Google
        </button>
      </div>
      <p className="text-center text-sm text-muted mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-green hover:underline">Log in</Link>
      </p>
    </div>
  );
}
