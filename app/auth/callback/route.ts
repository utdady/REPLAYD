import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/reset-password"];
  const nextFromUrl = searchParams.get("next");
  const nextFromCookie = request.cookies.get("_auth_next")?.value;
  const rawNext = nextFromUrl ?? nextFromCookie ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.includes("//") && !AUTH_PAGES.includes(rawNext)
    ? rawNext
    : "/";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    const errorMsg = errorDescription
      ? `${error}: ${errorDescription}`
      : error;
    const res = NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorMsg)}`
    );
    res.cookies.delete("_remember_me");
    res.cookies.delete("_auth_next");
    return res;
  }

  if (!code) {
    const res = NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("No confirmation code provided")}`
    );
    res.cookies.delete("_remember_me");
    res.cookies.delete("_auth_next");
    return res;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const rememberMe = request.cookies.get("_remember_me")?.value === "true";
  const extendedAuthOptions = rememberMe
    ? { maxAge: 60 * 60 * 24 * 365, expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }
    : {};

  // Collect all cookies that Supabase wants to set during the exchange
  const cookiesToReturn: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options = {} }) => {
          request.cookies.set(name, value);
          const isAuthCookie = name.startsWith("sb-") && name.includes("auth-token");
          const finalOptions = rememberMe && isAuthCookie ? { ...options, ...extendedAuthOptions } : options;
          cookiesToReturn.push({ name, value, options: finalOptions });
        });
      },
    },
  });

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  // Build the final redirect response
  let redirectUrl = `${origin}${next}`;
  if (exchangeError) {
    console.error("Auth callback error:", exchangeError);
    redirectUrl = `${origin}/login?error=${encodeURIComponent(exchangeError.message || "Could not confirm account")}`;
  }

  const response = NextResponse.redirect(redirectUrl);

  // Clear the temporary next cookie
  response.cookies.delete("_auth_next");

  // Apply all collected auth cookies to the response
  cookiesToReturn.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  // Keep _remember_me for future session refreshes; only delete on sign-out
  return response;
}
