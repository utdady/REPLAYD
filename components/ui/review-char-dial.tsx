"use client";

import * as React from "react";

const YELLOW_THRESHOLD = 260; // last 20 chars
const MAX = 280;

function getStrokeColor(value: number): string {
  if (value >= MAX) return "var(--red)";
  if (value >= YELLOW_THRESHOLD) return "var(--gold)";
  return "var(--green)";
}

export interface ReviewCharDialProps {
  value: number;
  max?: number;
  size?: number;
  className?: string;
}

export function ReviewCharDial({
  value,
  max = MAX,
  size = 44,
  className = "",
}: ReviewCharDialProps) {
  const fillRatio = Math.min(1, value / max);
  const strokeWidth = Math.max(4, size / 10);
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - fillRatio);
  const strokeColor = getStrokeColor(value);

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
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
    </div>
  );
}
