import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and anon key must be set");
  }

  // Check if "remember me" is enabled
  const rememberMe = cookieStore.get("_remember_me")?.value === "true";

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options = {} }) => {
            // Check if this is a Supabase auth cookie (typically starts with "sb-" and contains "auth-token")
            const isAuthCookie = name.startsWith("sb-") && name.includes("auth-token");
            
            if (rememberMe && isAuthCookie) {
              // Set longer expiration for auth cookies when "remember me" is enabled
              cookieStore.set(name, value, {
                ...options,
                maxAge: 60 * 60 * 24 * 365, // 1 year
                expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              });
            } else {
              cookieStore.set(name, value, options);
            }
          });
        } catch {
          // Ignore in Server Components
        }
      },
    },
  });
}
