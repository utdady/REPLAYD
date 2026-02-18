import Link from "next/link";
import { Button } from "@/components/ui/button";
import { login } from "@/app/(auth)/actions";

type SearchParams = { error?: string } | Promise<{ error?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const error = params?.error;

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
      <form action={login} className="space-y-4">
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
            autoComplete="current-password"
            required
            className="w-full rounded-badge border border-border2 bg-surface3 px-3 py-2 text-sm font-sans text-white placeholder:text-muted2 focus:outline-none focus:ring-1 focus:ring-green"
          />
        </div>
        <Button type="submit" variant="primary" className="w-full">
          Log in
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
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-green hover:underline">Sign up</Link>
      </p>
    </div>
  );
}
