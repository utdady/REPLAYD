"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Games", icon: "⚽" },
  { href: "/search", label: "Search", icon: "🔍" },
  { href: "/log", label: "Log", icon: "+", center: true },
  { href: "/activity", label: "Activity", icon: "⚡" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
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
            className={`bottom-nav__item ${isActive ? "bottom-nav__item--active" : ""}`}
          >
            <span aria-hidden>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
