import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    const cookieStore = await cookies();
    cookieStore.delete("_remember_me");
    const errorMsg = errorDescription 
      ? `${error}: ${errorDescription}` 
      : error;
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorMsg)}`
    );
  }

  if (!code) {
    const cookieStore = await cookies();
    cookieStore.delete("_remember_me");
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("No confirmation code provided")}`
    );
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("Auth callback error:", exchangeError);
    const cookieStore = await cookies();
    cookieStore.delete("_remember_me");
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(exchangeError.message || "Could not confirm account")}`
    );
  }

  // Clear the temporary rememberMe cookie after successful OAuth
  const cookieStore = await cookies();
  cookieStore.delete("_remember_me");

  // Success - redirect to home
  return NextResponse.redirect(`${origin}${next}`);
}
