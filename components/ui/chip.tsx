"use client";

import * as React from "react";

export interface ChipProps {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function Chip({ active = false, children, onClick, className = "" }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        shrink-0 rounded-pill px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors
        ${active
          ? "bg-green-dim text-green border border-green/20"
          : "bg-surface3 text-muted border border-transparent hover:text-white"
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
}
