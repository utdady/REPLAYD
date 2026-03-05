"use client";

import * as React from "react";

export type ReplaydStarsSize = "sm" | "md" | "lg";

const sizeMap: Record<ReplaydStarsSize, string> = {
  sm: "text-[10px]",
  md: "text-base",
  lg: "text-xl",
};

/** Shared readonly star display: gold outline, 1px black stroke, drop shadow. Use everywhere for consistent REPLAYD star style. */
export interface ReplaydStarsProps {
  value: number;
  size?: ReplaydStarsSize;
  className?: string;
}

const starStyle: React.CSSProperties = {
  color: "var(--gold)",
  WebkitTextStroke: "1px var(--black)",
  textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
  filter: "drop-shadow(1.5px 1.5px 2px rgba(0, 0, 0, 0.4))",
};

export function ReplaydStars({ value, size = "md", className = "" }: ReplaydStarsProps) {
  const filled = Math.min(5, Math.max(0, Math.round(value)));
  const sizeClass = sizeMap[size];
  return (
    <div
      className={`inline-flex shrink-0 items-center gap-[3px] leading-none ${sizeClass} ${className}`}
      aria-hidden
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="leading-none" style={starStyle}>
          {i <= filled ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}
