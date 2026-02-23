"use client";

import * as React from "react";

const YELLOW_THRESHOLD_OFFSET = 20; // last N chars show countdown
const DEFAULT_MAX = 180;

function getStrokeColor(value: number, max: number): string {
  const yellowStart = max - YELLOW_THRESHOLD_OFFSET;
  if (value >= max) return "var(--red)";
  if (value >= yellowStart) return "var(--gold)";
  return "var(--green)";
}

export interface ReviewCharDialProps {
  value: number;
  max?: number;
  size?: number;
  className?: string;
  showCountdown?: boolean;
}

export function ReviewCharDial({
  value,
  max = DEFAULT_MAX,
  size = 44,
  className = "",
  showCountdown = true,
}: ReviewCharDialProps) {
  const fillRatio = Math.min(1, value / max);
  const strokeWidth = Math.max(4, size / 10);
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - fillRatio);
  const strokeColor = getStrokeColor(value, max);
  const remaining = Math.max(0, max - value);
  const inCountdownZone = value >= max - YELLOW_THRESHOLD_OFFSET;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="shrink-0" aria-hidden>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          className="transition-[stroke-dashoffset,stroke] duration-150"
        />
      </svg>
      {showCountdown && inCountdownZone && (
        <span
          className="absolute inset-0 flex items-center justify-center text-xs font-mono font-semibold tabular-nums"
          style={{
            color: value >= max ? "var(--red)" : "var(--gold)",
          }}
          aria-hidden
        >
          {remaining}
        </span>
      )}
    </div>
  );
}
