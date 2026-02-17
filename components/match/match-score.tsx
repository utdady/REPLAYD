import * as React from "react";

export interface MatchScoreProps {
  home: number | null;
  away: number | null;
  scheduled?: boolean;
  className?: string;
}

export function MatchScore({ home, away, scheduled = false, className = "" }: MatchScoreProps) {
  if (scheduled) {
    return (
      <span className={`font-display text-lg text-muted ${className}`} style={{ letterSpacing: "0.02em" }}>
        vs
      </span>
    );
  }

  return (
    <span className={`font-display text-lg ${className}`} style={{ letterSpacing: "0.02em", fontSize: "1.2rem" }}>
      {home ?? 0} – {away ?? 0}
    </span>
  );
}
