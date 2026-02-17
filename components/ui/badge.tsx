import * as React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-badge bg-green-dim px-2 py-0.5 text-xs font-mono font-medium uppercase tracking-wider text-green ${className}`}
    >
      {children}
    </span>
  );
}
