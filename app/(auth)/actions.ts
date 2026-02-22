"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";

const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/reset-password"];

export async function login(formData: FormData) {
  try {
    const cookieStore = await cookies();
    const rememberMe = formData.get("rememberMe") === "true";
    
    if (rememberMe) {
      cookieStore.set("_remember_me", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year - persist for session refreshes
      });
    }

    const supabase = await createClient();

    const identifier = (formData.get("identifier") as string)?.trim().substring(0, 255);
    const password = (formData.get("password") as string)?.substring(0, 128);

    if (!identifier || !password) {
      redirect("/login?error=" + encodeURIComponent("Please fill in all fields"));
    }

    // Determine if the identifier is an email or username
    let email = identifier;
    const isEmail = identifier.includes("@");

    if (!isEmail) {
      // Look up the user's email from profiles + auth.users via DB
      const { rows } = await query<{ email: string }>(
        `SELECT au.email FROM profiles p
         JOIN auth.users au ON au.id = p.id
         WHERE LOWER(p.username) = LOWER($1)
         LIMIT 1`,
        [identifier]
      );
      if (rows.length === 0) {
        cookieStore.delete("_remember_me");
        redirect("/login?error=" + encodeURIComponent("No account found with that username"));
      }
      email = rows[0].email;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      cookieStore.delete("_remember_me");
      redirect("/login?error=" + encodeURIComponent(error.message));
    }

    // Keep _remember_me for session refreshes; only delete on sign-out

    const nextPath = (formData.get("next") as string)?.trim();
    const safeNext = nextPath && nextPath.startsWith("/") && !nextPath.includes("//") && !AUTH_PAGES.includes(nextPath)
      ? nextPath
      : "/";

    revalidatePath("/", "layout");
    redirect(safeNext);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e && typeof (e as { digest?: string }).digest === "string") {
      throw e;
    }
    const message = e instanceof Error ? e.message : "Something went wrong";
    redirect("/login?error=" + encodeURIComponent(message));
  }
}

export async function checkEmailExists(email: string): Promise<{ exists: boolean }> {
  if (!email || !email.trim()) {
    return { exists: false };
  }
  const supabase = await createClient();
  const { data } = await supabase.auth.admin.listUsers();
  // Note: admin.listUsers() requires service role key. For client-side, we'll check via signup error instead.
  // This is a server action, so we can use admin if service role is available.
  // Fallback: check via signup attempt error message
  return { exists: false }; // Will be handled via signup error
}

export async function checkUsername(username: string): Promise<{ available: boolean; suggestions?: string[] }> {
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
  const available = rows[0]?.count === 0;
  
  if (!available) {
    // Generate suggestions
    const suggestions: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const candidate = `${sanitized}_${i}`;
      const { rows: checkRows } = await query<{ count: number }>(
        "SELECT COUNT(*)::int as count FROM profiles WHERE LOWER(username) = $1",
        [candidate]
      );
      if (checkRows[0]?.count === 0) {
        suggestions.push(candidate);
        if (suggestions.length >= 3) break;
      }
    }
    // If still need more, try with random suffix
    if (suggestions.length < 3) {
      for (let i = 0; i < 10 && suggestions.length < 3; i++) {
        const random = Math.floor(Math.random() * 1000);
        const candidate = `${sanitized}${random}`;
        if (candidate.length <= 30) {
          const { rows: checkRows } = await query<{ count: number }>(
            "SELECT COUNT(*)::int as count FROM profiles WHERE LOWER(username) = $1",
            [candidate]
          );
          if (checkRows[0]?.count === 0 && !suggestions.includes(candidate)) {
            suggestions.push(candidate);
          }
        }
      }
    }
    return { available: false, suggestions };
  }
  
  return { available: true };
}

export async function signInWithGoogle(formData?: FormData) {
  const cookieStore = await cookies();
  const rememberMe = formData?.get("rememberMe") === "true";
  const nextPath = (formData?.get("next") as string)?.trim();
  const safeNext = nextPath && nextPath.startsWith("/") && !nextPath.includes("//") && !AUTH_PAGES.includes(nextPath)
    ? nextPath
    : "/";

  // Store next path for redirect after OAuth callback
  cookieStore.set("_auth_next", safeNext, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 5,
    path: "/",
  });

  // Store rememberMe preference in a temporary cookie before OAuth redirect
  if (rememberMe) {
    cookieStore.set("_remember_me", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year - persist for session refreshes
    });
  }

  const supabase = await createClient();
  // Use NEXT_PUBLIC_SITE_URL, falling back to Vercel's auto-set URL, then localhost
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://localhost:3001";
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    // Clear rememberMe cookie on error
    cookieStore.delete("_remember_me");
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
    return;
  }

  if (data?.url) {
    redirect(data.url);
  } else {
    cookieStore.delete("_remember_me");
    redirect("/login?error=Failed+to+initiate+Google+sign-in");
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = (formData.get("email") as string)?.trim().substring(0, 255);
  const password = (formData.get("password") as string)?.substring(0, 128);
  const passwordConfirm = (formData.get("passwordConfirm") as string)?.substring(0, 128);
  const username = (formData.get("username") as string)?.trim().substring(0, 30);

  if (!email || !password || !username) {
    redirect("/signup?error=Please+fill+in+all+fields");
  }

  if (password !== passwordConfirm) {
    redirect("/signup?error=Passwords+do+not+match");
  }

  if (password.length < 8) {
    redirect("/signup?error=Password+must+be+at+least+8+characters");
  }

  // Validate username format
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    redirect("/signup?error=Username+must+be+3-30+characters+and+contain+only+letters%2C+numbers%2C+and+underscores");
  }

  // Check username availability
  const usernameCheck = await checkUsername(username);
  if (!usernameCheck.available) {
    const suggestions = usernameCheck.suggestions || [];
    const suggestionsParam = suggestions.length > 0 
      ? `&suggestions=${encodeURIComponent(JSON.stringify(suggestions))}`
      : "";
    redirect(`/signup?error=Username+is+already+taken${suggestionsParam}&username=${encodeURIComponent(username)}`);
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://localhost:3001";
  
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
    // Check if email already exists
    if (error.message.includes("already registered") || error.message.includes("already exists") || error.message.includes("User already registered")) {
      redirect(`/signup?error=This+email+is+already+registered.+Try+logging+in+instead+or+reset+your+password&email=${encodeURIComponent(email)}`);
    }
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/signup?message=Check+your+email+to+confirm+your+account&email=${encodeURIComponent(email)}`);
}

export async function resetPasswordRequest(email: string): Promise<{ success: boolean; error?: string }> {
  if (!email || !email.trim()) return { success: false, error: "Email is required" };

  const trimmed = email.trim().substring(0, 255);
  const supabase = await createClient();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://localhost:3001";

  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo: `${siteUrl}/reset-password`,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword.substring(0, 128) });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function resendConfirmation(email: string): Promise<{ success: boolean; error?: string }> {
  if (!email || !email.trim()) return { success: false, error: "Email is required" };

  const trimmed = email.trim().substring(0, 255);
  const supabase = await createClient();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://localhost:3001";

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: trimmed,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function signout() {
  const cookieStore = await cookies();
  cookieStore.delete("_remember_me");
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
