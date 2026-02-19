import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
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
    return res;
  }

  if (!code) {
    const res = NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("No confirmation code provided")}`
    );
    res.cookies.delete("_remember_me");
    return res;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
          cookiesToReturn.push({ name, value, options });
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

  // Apply all collected auth cookies to the response
  cookiesToReturn.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  response.cookies.delete("_remember_me");
  return response;
}
