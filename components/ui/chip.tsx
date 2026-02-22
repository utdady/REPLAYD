"use client";

import * as React from "react";

export interface ChipProps {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  comingSoon?: boolean;
}

export function Chip({ active = false, children, onClick, className = "", disabled = false, comingSoon = false }: ChipProps) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        shrink-0 rounded-pill px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors
        ${active && !disabled
          ? "bg-green-dim text-green border border-green/20"
          : "bg-surface3 text-muted border border-transparent hover:text-white"
        }
        ${disabled ? "cursor-not-allowed opacity-60 hover:opacity-60" : ""}
        ${comingSoon ? "flex flex-col items-center gap-0.5 py-2 opacity-80" : ""}
        ${className}
      `}
    >
      {children}
      {comingSoon && <span className="text-[10px] font-normal normal-case tracking-normal text-muted">Coming soon</span>}
    </button>
  );
}
