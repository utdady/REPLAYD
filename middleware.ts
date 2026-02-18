import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Routes that require authentication
const PROTECTED_ROUTES = ["/log", "/activity", "/profile", "/users/me"];
const AUTH_PAGES = ["/login", "/signup"];

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

  // Skip auth logic on login/signup so we never redirect away from them
  // unless we're sure the user is logged in (avoids redirect loops from stale cookies)
  const isAuthPage = AUTH_PAGES.includes(pathname);

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request: { headers: request.headers } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  // On login/signup: always show the page, never redirect (avoids redirect loop from stale cookies)
  if (isAuthPage) {
    return response;
  }

  // Protected routes: require login
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "Please+log+in+to+continue");
    const redirectRes = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach(({ name, value, options }) => {
      redirectRes.cookies.set(name, value, options);
    });
    return redirectRes;
  }

  // Logged-in users on auth pages would redirect to / — disabled to prevent loops; they can use nav to go home
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
