"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signup, checkUsername, signInWithGoogle } from "@/app/(auth)/actions";

export default function SignupPage() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const error = searchParams.get("error");
  const message = searchParams.get("message");
  const errorUsername = searchParams.get("username");
  const errorSuggestions = searchParams.get("suggestions");
  const errorEmail = searchParams.get("email");

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
      const result = await checkUsername(trimmed);
      if (result.available) {
        setUsernameStatus("available");
        setSuggestions([]);
      } else {
        setUsernameStatus("taken");
        setSuggestions(result.suggestions || []);
      }
    }, 500);
  };

  useEffect(() => {
    // Load suggestions from URL if present (from server redirect)
    if (errorUsername && errorSuggestions) {
      try {
        const parsed = JSON.parse(decodeURIComponent(errorSuggestions));
        if (Array.isArray(parsed)) {
          setSuggestions(parsed);
          setUsername(errorUsername);
          setUsernameStatus("taken");
        }
      } catch {
        // Ignore parse errors
      }
    }
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [errorUsername, errorSuggestions]);

  return (
    <div className="bg-surface border border-border rounded-card p-8">
      <Link href="/" className="font-display text-xl tracking-[0.05em] text-white block text-center mb-8">
        REPLAY<span className="text-green">D</span>
      </Link>
      <h1 className="font-display text-2xl tracking-wide text-center mb-6">Sign up</h1>
      {error && (
        <div className="mb-4 p-3 rounded-badge bg-red/10 border border-red/30 text-red text-sm font-sans">
          <p>{decodeURIComponent(error)}</p>
          {error.includes("already registered") && errorEmail && (
            <div className="mt-2 pt-2 border-t border-red/20">
              <Link href={`/login?email=${encodeURIComponent(errorEmail)}`} className="text-green hover:underline text-xs">
                Log in instead →
              </Link>
              {" · "}
              <Link href={`/login?reset=true&email=${encodeURIComponent(errorEmail)}`} className="text-green hover:underline text-xs">
                Reset password →
              </Link>
            </div>
          )}
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
              <div>
                <p className="text-xs text-red mb-1">✗ Username already taken</p>
                {suggestions.length > 0 && (
                  <div className="mt-1">
                    <p className="text-xs text-muted mb-1">Suggestions:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => {
                            setUsername(sug);
                            handleUsernameChange(sug);
                          }}
                          className="text-xs px-2 py-0.5 rounded bg-surface3 border border-border2 text-green hover:border-green transition-colors"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
            maxLength={255}
            className="w-full rounded-badge border border-border2 bg-surface3 px-3 py-2 text-sm font-sans text-white placeholder:text-muted2 focus:outline-none focus:ring-1 focus:ring-green"
            placeholder="you@example.com"
            defaultValue={errorEmail || ""}
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
            maxLength={128}
            className="w-full rounded-badge border border-border2 bg-surface3 px-3 py-2 text-sm font-sans text-white placeholder:text-muted2 focus:outline-none focus:ring-1 focus:ring-green"
          />
          <p className="text-xs text-muted2 mt-1">At least 8 characters</p>
        </div>
        <Button type="submit" variant="primary" className="w-full" disabled={isPending || usernameStatus === "taken" || usernameStatus === "invalid" || usernameStatus === "checking"}>
          {isPending ? "Signing up..." : "Sign up"}
        </Button>
      </form>
      <div className="mt-4 pt-4 border-t border-border">
        <form action={() => startGoogleTransition(() => signInWithGoogle())}>
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
        Already have an account?{" "}
        <Link href="/login" className="text-green hover:underline">Log in</Link>
      </p>
    </div>
  );
}
