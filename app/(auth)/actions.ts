"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/signup?error=Please+fill+in+all+fields");
  }

  if (password.length < 8) {
    redirect("/signup?error=Password+must+be+at+least+8+characters");
  }

  // Use environment variable or default to localhost:3001 for dev
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
  
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
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
