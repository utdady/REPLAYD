import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/landing-page";
import { HomeFeed } from "@/components/landing/home-feed";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Show feed for logged-in users, landing for guests
  if (user) {
    return <HomeFeed />;
  }

  return <LandingPage />;
}
