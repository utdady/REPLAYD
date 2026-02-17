import * as React from "react";
import Link from "next/link";

export interface ScrollRowProps {
  title: string;
  seeAllHref?: string;
  children: React.ReactNode;
  className?: string;
}

export function ScrollRow({ title, seeAllHref, children, className = "" }: ScrollRowProps) {
  return (
    <section className={className}>
      <header className="flex justify-between items-center px-4 pb-2">
        <h3 className="text-sm font-semibold font-sans text-white">{title}</h3>
        {seeAllHref ? (
          <Link href={seeAllHref} className="text-xs text-muted2 hover:text-muted">
            See all ›
          </Link>
        ) : null}
      </header>
      <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide">
        {children}
      </div>
    </section>
  );
}
