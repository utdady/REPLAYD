"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { signup, checkUsername, signInWithGoogle, resendConfirmation } from "@/app/(auth)/actions";
import { getPasswordStrength } from "@/lib/password-strength";

export default function SignupPage() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [resending, setResending] = useState(false);
  const [resendResult, setResendResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const [resendEmail, setResendEmail] = useState("");

  const error = searchParams.get("error");
  const message = searchParams.get("message");
  const errorUsername = searchParams.get("username");
  const errorSuggestions = searchParams.get("suggestions");
  const errorEmail = searchParams.get("email");

  const strength = getPasswordStrength(password);
  const passwordsMatch = password === passwordConfirm;
  const passwordMismatch = passwordConfirm.length > 0 && !passwordsMatch;

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

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

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
              <Link href={`/forgot-password`} className="text-green hover:underline text-xs">
                Reset password →
              </Link>
            </div>
          )}
        </div>
      )}
      {message && (
        <div className="mb-4 p-4 rounded-badge bg-green-dim border border-green/30 text-sm font-sans">
          <p className="text-green mb-3">{decodeURIComponent(message)}</p>
          <p className="text-muted text-xs mb-3">
            Didn&apos;t receive it? Check your spam folder or resend below.
          </p>
          {!errorEmail && (
            <FloatingLabelInput
              id="resend-email"
              name="resend-email"
              type="email"
              label="Enter your email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              maxLength={255}
              className="mb-2"
            />
          )}
          <button
            type="button"
            disabled={resending || (!errorEmail && !resendEmail.trim())}
            onClick={async () => {
              const emailVal = errorEmail || resendEmail.trim();
              if (!emailVal) return;
              setResending(true);
              setResendResult(null);
              const result = await resendConfirmation(emailVal);
              setResendResult(result);
              setResending(false);
            }}
            className="text-xs font-semibold text-green hover:underline disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend confirmation email"}
          </button>
          {resendResult?.success && (
            <p className="text-xs text-green mt-2">Confirmation email sent! Check your inbox.</p>
          )}
          {resendResult?.error && (
            <p className="text-xs text-red mt-2">{resendResult.error}</p>
          )}
        </div>
      )}
      <form action={(formData) => startTransition(() => signup(formData))} className="space-y-4">
        <div>
          <FloatingLabelInput
            id="username"
            name="username"
            type="text"
            label="Username"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            autoComplete="username"
            required
            minLength={3}
            maxLength={30}
            pattern="[a-zA-Z0-9_]{3,30}"
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
        <FloatingLabelInput
          id="email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          required
          maxLength={255}
          defaultValue={errorEmail || ""}
        />
        <div>
          <FloatingLabelInput
            id="password"
            name="password"
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            showPasswordToggle
          />
          <div className="mt-1.5">
            <div className="flex gap-0.5 h-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-colors ${
                    i < strength.score
                      ? strength.score <= 1
                        ? "bg-red"
                        : strength.score <= 2
                        ? "bg-amber-500"
                        : strength.score <= 3
                        ? "bg-yellow-500"
                        : "bg-green"
                      : "bg-surface3"
                  }`}
                />
              ))}
            </div>
            {password.length > 0 && (
              <p className="text-xs text-muted mt-0.5">{strength.label}</p>
            )}
            {password.length === 0 && (
              <p className="text-xs text-muted2">At least 8 characters</p>
            )}
          </div>
        </div>
        <div>
          <FloatingLabelInput
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            label="Confirm password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            showPasswordToggle
          />
          {passwordMismatch && (
            <p className="text-xs text-red mt-1">Passwords do not match</p>
          )}
        </div>
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={
            isPending ||
            usernameStatus === "taken" ||
            usernameStatus === "invalid" ||
            usernameStatus === "checking" ||
            passwordMismatch
          }
        >
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
