import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { signout } from "@/app/(auth)/actions";

const navLinks = [
  { href: "/", label: "Matches" },
  { href: "/lists", label: "Lists" },
  { href: "/community", label: "Community" },
];

export async function Nav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-10 py-5 bg-gradient-to-b from-black/98 to-transparent backdrop-blur-sm">
      <Link href="/" className="font-display text-xl tracking-[0.15em] text-green">
        REPLAY<span className="text-white">D</span>
      </Link>
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-xs font-mono uppercase tracking-widest text-muted hover:text-white transition-colors"
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <Link href="/profile" className="text-xs font-mono uppercase tracking-widest text-muted hover:text-white hidden sm:inline">
              Profile
            </Link>
            <form action={signout}>
              <Button type="submit" variant="ghost" className="text-xs">
                Sign out
              </Button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="text-xs font-mono uppercase tracking-widest text-muted hover:text-white hidden sm:inline">
              Log in
            </Link>
            <Link href="/signup">
              <Button variant="primary">Sign up free</Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
