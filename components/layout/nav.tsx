import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { signout } from "@/app/(auth)/actions";

const navLinks = [
  { href: "/", label: "Games" },
  { href: "/search", label: "Search" },
  { href: "/lists", label: "Lists" },
  { href: "/community", label: "Community" },
];

export async function Nav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-14 flex items-center px-6 md:px-10 bg-gradient-to-b from-black/98 to-transparent backdrop-blur-sm">
      <Link href="/" className="font-display text-xl tracking-[0.15em] text-green shrink-0">
        REPLAY<span className="text-white">D</span>
      </Link>
      <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-[.7rem] font-mono uppercase tracking-[.18em] text-muted hover:text-white transition-colors"
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-4 shrink-0 ml-auto md:ml-0 flex-nowrap">
        {user ? (
          <>
            <Link href="/profile" className="text-[.7rem] font-mono uppercase tracking-[.18em] text-muted hover:text-white hidden sm:inline transition-colors whitespace-nowrap">
              Profile
            </Link>
            <form action={signout} className="inline-flex items-center">
              <button
                type="submit"
                className="text-[.7rem] font-mono uppercase tracking-[.18em] font-bold text-green hover:text-green/80 transition-colors bg-transparent border-none cursor-pointer p-0 leading-none"
              >
                Sign out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="text-[.7rem] font-mono uppercase tracking-[.18em] text-muted hover:text-white hidden sm:inline transition-colors whitespace-nowrap">
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
