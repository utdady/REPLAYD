import * as React from "react";

export interface SectionEyebrowProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionEyebrow({ children, className = "" }: SectionEyebrowProps) {
  return (
    <p className={`font-mono text-[0.65rem] tracking-[0.22em] uppercase text-green flex items-center gap-3 ${className}`}>
      {children}
      <span className="w-10 h-px bg-border opacity-40" />
    </p>
  );
}
