import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/landing-page";
import { HomeFeed } from "@/components/landing/home-feed";

// Auth/session uses cookies — cannot be statically generated
export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      return <HomeFeed />;
    }

    return <LandingPage />;
  } catch (err) {
    // Prevent "Application error" crash when env vars are missing or Supabase fails
    console.error("HomePage:", err);
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <h1 className="font-display text-2xl text-white mb-2">REPLAYD</h1>
        <p className="text-muted text-sm text-center max-w-md">
          Configuration error. Check that <code className="text-white">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-white">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are set in your deployment (Vercel → Project → Settings → Environment Variables). See server logs for details.
        </p>
      </div>
    );
  }
}
