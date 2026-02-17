import Link from "next/link";

const FOOTER_LINKS = [
  { href: "#", label: "About" },
  { href: "#", label: "Privacy" },
  { href: "#", label: "Twitter" },
  { href: "#", label: "API" },
];

export function Footer() {
  return (
    <footer className="border-t border-border py-7 px-6 md:px-10 flex flex-wrap items-center justify-between gap-4">
      <div className="font-display text-xl tracking-[0.15em] text-green">REPLAYD</div>
      <ul className="flex gap-8 list-none">
        {FOOTER_LINKS.map(({ href, label }) => (
          <li key={label}>
            <Link href={href} className="text-[0.72rem] text-muted hover:text-white transition-colors tracking-wide">
              {label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="font-mono text-[0.6rem] text-muted2 tracking-wider">© 2025 REPLAYD</div>
    </footer>
  );
}
