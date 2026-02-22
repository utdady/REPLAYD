"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { createClient } from "@/lib/supabase/client";
import { updatePassword } from "@/app/(auth)/actions";
import { getPasswordStrength } from "@/lib/password-strength";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [hasRecoveryToken, setHasRecoveryToken] = useState<boolean | null>(null);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const params = new URLSearchParams(hash.substring(1));
    const type = params.get("type");
    if (type === "recovery") {
      setHasRecoveryToken(true);
      // Process the hash so Supabase sets the session in cookies for the server action
      const supabase = createClient();
      supabase.auth.getSession();
    } else {
      setHasRecoveryToken(false);
    }
  }, []);

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== passwordConfirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setIsPending(true);
    const result = await updatePassword(password);
    setIsPending(false);
    if (result.success) {
      router.push("/login?message=Password+reset+successfully.+You+can+now+log+in.");
    } else {
      setError(result.error ?? "Something went wrong");
    }
  };

  if (hasRecoveryToken === false) {
    return (
        <div className="bg-surface border border-border rounded-card p-8">
          <Link href="/" className="font-display text-xl tracking-[0.05em] text-white block text-center mb-8">
            REPLAY<span className="text-green">D</span>
          </Link>
          <h1 className="font-display text-2xl tracking-wide text-center mb-6">Reset password</h1>
          <p className="text-sm text-muted text-center mb-6">
            Use the link from your email to reset your password. The link may have expired.
          </p>
          <Link href="/forgot-password" className="block text-center text-green hover:underline">
            Request a new reset link
          </Link>
        </div>
      );
  }

  return (
    <div className="bg-surface border border-border rounded-card p-8">
      <Link href="/" className="font-display text-xl tracking-[0.05em] text-white block text-center mb-8">
        REPLAY<span className="text-green">D</span>
      </Link>
      <h1 className="font-display text-2xl tracking-wide text-center mb-6">Set new password</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-badge bg-red/10 border border-red/30 text-red text-sm font-sans">
            {error}
          </div>
        )}
        <div>
          <FloatingLabelInput
            id="password"
            name="password"
            type="password"
            label="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
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
          </div>
        </div>
        <FloatingLabelInput
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          label="Confirm password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          showPasswordToggle
        />
        <Button type="submit" variant="primary" className="w-full" disabled={isPending}>
          {isPending ? "Updating..." : "Update password"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted mt-6">
        <Link href="/login" className="text-green hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
