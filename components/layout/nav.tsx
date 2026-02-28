import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { signout } from "@/app/(auth)/actions";
import { getUnreadCount, getNotifications, markAllRead } from "@/app/actions/notifications";

function getNotificationLabel(type: string): string {
  switch (type) {
    case "log_like":
      return "liked your review";
    case "comment":
      return "commented on your review";
    case "follow":
      return "started following you";
    case "post_like":
      return "liked your post";
    default:
      return "did something cool";
  }
}

const navLinks = [
  { href: "/", label: "Games" },
  { href: "/search", label: "Search" },
  { href: "/lists", label: "Lists" },
  { href: "/community", label: "Community" },
];

export async function Nav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [unreadCount, recentNotifications] = user
    ? await Promise.all([
        getUnreadCount(),
        getNotifications({ limit: 10 }),
      ])
    : [0, []];

  const navTextClass = "text-[.7rem] font-mono uppercase tracking-[.18em] leading-none";

  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-12 flex items-center px-4 sm:px-6 md:px-10 bg-gradient-to-b from-black/98 to-transparent backdrop-blur-sm overflow-visible">
      <Link href="/" className={`font-display ${navTextClass} text-[.85rem] text-green shrink-0`}>
        REPLAY<span className="text-white">D</span>
      </Link>
      <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`${navTextClass} text-muted hover:text-white transition-colors`}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3 sm:gap-4 shrink-0 ml-auto md:ml-0 flex-nowrap min-h-[2rem]">
        {user ? (
          <>
            <div className="relative group flex items-center min-h-[2rem]">
              <form
                action={async () => {
                  "use server";
                  await markAllRead();
                }}
                className="flex items-center min-h-[2rem]"
              >
                <button
                  type="submit"
                  className="relative w-8 h-8 min-w-8 min-h-8 rounded-full flex items-center justify-center text-muted hover:text-white hover:bg-surface2 transition-colors p-0 border-0"
                  aria-label="Notifications"
                >
                  <span className="text-[.7rem] leading-none">🔔</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-1 rounded-full bg-green text-black text-[0.6rem] font-mono font-bold flex items-center justify-center leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </form>
              <div className="hidden group-hover:block absolute top-full right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-surface border border-border rounded-card shadow-lg z-[100]">
                <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                  <span className="text-[0.75rem] font-semibold tracking-[0.08em] uppercase text-muted">
                    Notifications
                  </span>
                  <Link
                    href="/notifications"
                    className="text-[0.7rem] font-mono uppercase tracking-[0.12em] text-green hover:text-green/80"
                  >
                    View all
                  </Link>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {recentNotifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-[0.8rem] text-muted">
                      No notifications yet.
                    </div>
                  ) : (
                    recentNotifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.log_id ? `/community?log=${n.log_id}` : "/community"}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-surface2 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-surface3 flex items-center justify-center text-[0.9rem]">
                          {n.actor.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={n.actor.avatar_url}
                              alt={n.actor.display_name ?? n.actor.username}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <span>{n.actor.username.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.8rem] text-white truncate">
                            <span className="font-semibold">{n.actor.display_name ?? n.actor.username}</span>{" "}
                            {getNotificationLabel(n.type)}
                          </p>
                          <p className="text-[0.7rem] text-muted mt-0.5">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
            <Link href="/profile" className={`${navTextClass} text-muted hover:text-white hidden sm:inline-flex sm:items-center transition-colors whitespace-nowrap`}>
              Profile
            </Link>
            <form action={signout} className="inline-flex items-center min-h-[2rem]">
              <button
                type="submit"
                className={`${navTextClass} text-green hover:text-green/80 transition-colors bg-transparent border-none cursor-pointer p-0 m-0 inline-flex items-center min-h-[2rem]`}
              >
                Sign out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className={`${navTextClass} text-muted hover:text-white hidden sm:inline-flex sm:items-center transition-colors whitespace-nowrap`}>
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
