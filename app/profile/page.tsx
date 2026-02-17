import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileRedirectPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Please+log+in+to+view+your+profile");
  }

  // Resolve "me" to actual username - for now redirect to a placeholder
  // TODO: Once you have a users table with usernames, query it here
  // For now, we'll use the user's email prefix or ID
  const username = user.user_metadata?.username || user.email?.split("@")[0] || user.id;
  redirect(`/users/${username}`);
}
