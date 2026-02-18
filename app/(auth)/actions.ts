"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";

export async function login(formData: FormData) {
  try {
    const supabase = await createClient();

    const email = (formData.get("email") as string)?.trim();
    const password = formData.get("password") as string;

    if (!email || !password) {
      redirect("/login?error=" + encodeURIComponent("Please fill in email and password"));
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      redirect("/login?error=" + encodeURIComponent(error.message));
    }

    revalidatePath("/", "layout");
    redirect("/");
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e && typeof (e as { digest?: string }).digest === "string") {
      throw e; // Next.js redirect() throws a special error
    }
    const message = e instanceof Error ? e.message : "Something went wrong";
    redirect("/login?error=" + encodeURIComponent(message));
  }
}

export async function checkUsername(username: string): Promise<{ available: boolean }> {
  if (!username || username.trim().length === 0) {
    return { available: false };
  }
  const sanitized = username.trim().toLowerCase();
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(sanitized)) {
    return { available: false };
  }
  const { rows } = await query<{ count: number }>(
    "SELECT COUNT(*)::int as count FROM profiles WHERE LOWER(username) = $1",
    [sanitized]
  );
  return { available: rows[0]?.count === 0 };
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const username = (formData.get("username") as string)?.trim();

  if (!email || !password || !username) {
    redirect("/signup?error=Please+fill+in+all+fields");
  }

  if (password.length < 8) {
    redirect("/signup?error=Password+must+be+at+least+8+characters");
  }

  // Validate username format
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    redirect("/signup?error=Username+must+be+3-30+characters+and+contain+only+letters%2C+numbers%2C+and+underscores");
  }

  // Check username availability
  const { available } = await checkUsername(username);
  if (!available) {
    redirect("/signup?error=Username+is+already+taken");
  }

  // Use environment variable or default to localhost:3001 for dev
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
  
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      data: {
        username: username.toLowerCase(), // Store lowercase for consistency
      },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/signup?message=Check+your+email+to+confirm+your+account");
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
