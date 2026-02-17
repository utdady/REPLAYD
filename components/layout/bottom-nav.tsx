"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Matches", icon: "⚽" },
  { href: "/search", label: "Search", icon: "🔍" },
  { href: "/log", label: "Log", icon: "+", center: true },
  { href: "/activity", label: "Activity", icon: "⚡" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-surface border-t border-border md:hidden">
      <div className="flex items-end justify-around h-14 px-2">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href === "/" && pathname === "/");
          const isCenter = item.center;

          if (isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-1.5 w-14 h-14 rounded-full bg-green text-black font-semibold shadow-[0_0_20px_var(--green-glow)]"
              >
                <span className="text-lg leading-none">+</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 py-2 min-w-[56px]"
            >
              <span className="text-lg" aria-hidden>{item.icon}</span>
              <span className={`text-[10px] font-sans font-medium ${isActive ? "text-green" : "text-muted2"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
