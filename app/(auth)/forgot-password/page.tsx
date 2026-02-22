"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { resetPasswordRequest } from "@/app/(auth)/actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Email is required");
      return;
    }
    setIsPending(true);
    setError(null);
    const result = await resetPasswordRequest(trimmed);
    setIsPending(false);
    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error ?? "Something went wrong");
    }
  };

  return (
    <div className="bg-surface border border-border rounded-card p-8">
      <Link href="/" className="font-display text-xl tracking-[0.05em] text-white block text-center mb-8">
        REPLAY<span className="text-green">D</span>
      </Link>
      <h1 className="font-display text-2xl tracking-wide text-center mb-6">Forgot your password?</h1>
      <p className="text-sm text-muted text-center mb-6">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      {submitted ? (
        <div className="mb-4 p-4 rounded-badge bg-green-dim border border-green/30 text-sm font-sans text-center">
          <p className="text-green">Check your email for a link to reset your password.</p>
          <p className="text-muted text-xs mt-2">If you don&apos;t see it, check your spam folder.</p>
          <Link href="/login" className="inline-block mt-4 text-green hover:underline text-sm font-semibold">
            Back to log in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-badge bg-red/10 border border-red/30 text-red text-sm font-sans">
              {error}
            </div>
          )}
          <FloatingLabelInput
            id="email"
            name="email"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={255}
            autoComplete="email"
          />
          <Button type="submit" variant="primary" className="w-full" disabled={isPending}>
            {isPending ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-muted mt-6">
        Remember your password?{" "}
        <Link href="/login" className="text-green hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
