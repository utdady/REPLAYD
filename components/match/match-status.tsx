import * as React from "react";

export interface MatchStatusProps {
  live?: boolean;
  minute?: number | null;
  time?: string;
  className?: string;
}

export function MatchStatus({ live = false, minute = null, time, className = "" }: MatchStatusProps) {
  if (live && minute != null) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-mono text-red ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-red" aria-hidden />
        LIVE {minute}&apos;
      </span>
    );
  }

  return (
    <span className={`text-xs font-mono text-muted ${className}`}>
      {time ?? "vs"}
    </span>
  );
}
