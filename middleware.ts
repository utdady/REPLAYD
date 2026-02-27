import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Only these routes are public; all others require login.
const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/reset-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const isAuthPage = AUTH_PAGES.includes(pathname);
  const rememberMe = request.cookies.get("_remember_me")?.value === "true";
  const extendedAuthOptions = rememberMe
    ? { maxAge: 60 * 60 * 24 * 365, expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }
    : {};

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request: { headers: request.headers } });
        cookiesToSet.forEach(({ name, value, options = {} }) => {
          const isAuthCookie = name.startsWith("sb-") && name.includes("auth-token");
          const finalOptions = rememberMe && isAuthCookie ? { ...options, ...extendedAuthOptions } : options;
          response.cookies.set(name, value, finalOptions);
        });
      },
    },
  });

  // Always call getUser to refresh the session token if needed
  const { data: { user } } = await supabase.auth.getUser();

  // Public: home page and auth pages
  const isPublic = pathname === "/" || isAuthPage;
  if (isPublic) {
    return response;
  }

  // Require login for all other routes
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "Please log in to continue");
    loginUrl.searchParams.set("next", pathname);
    const redirectRes = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((cookie) => {
      const { name, value, ...opts } = cookie;
      redirectRes.cookies.set(name, value, opts);
    });
    return redirectRes;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
