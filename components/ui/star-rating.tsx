"use client";

import * as React from "react";

export type StarSize = "sm" | "md" | "lg";

const sizeMap: Record<StarSize, number> = { sm: 10, md: 14, lg: 20 };

export interface StarRatingProps {
  value: number | null;
  onChange?: (value: number | null) => void;
  size?: StarSize;
  readonly?: boolean;
  className?: string;
}

export function StarRating({
  value,
  onChange,
  size = "md",
  readonly = false,
  className = "",
}: StarRatingProps) {
  const px = sizeMap[size];
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);
  const display = hoverValue ?? value ?? 0;

  const handleClick = (clickedValue: number) => {
    if (readonly || !onChange) return;
    const next = value === clickedValue ? null : clickedValue;
    onChange(next);
  };

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`}
      onMouseLeave={() => setHoverValue(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = display >= star;
        const half = display >= star - 0.5 && display < star;
        const uniqueId = React.useId();
        return (
          <div key={star} className="relative inline-block" style={{ width: px, height: px }}>
            {/* Left half clickable area (half star) */}
            <button
              type="button"
              disabled={readonly}
              className={`absolute left-0 top-0 bottom-0 ${readonly ? "cursor-default" : "cursor-pointer"}`}
              style={{ width: px / 2, height: px }}
              onMouseEnter={() => !readonly && setHoverValue(star - 0.5)}
              onClick={() => handleClick(star - 0.5)}
              aria-label={readonly ? undefined : `Rate ${star - 0.5} stars`}
            />
            {/* Right half clickable area (full star) */}
            <button
              type="button"
              disabled={readonly}
              className={`absolute right-0 top-0 bottom-0 ${readonly ? "cursor-default" : "cursor-pointer"}`}
              style={{ width: px / 2, height: px }}
              onMouseEnter={() => !readonly && setHoverValue(star)}
              onClick={() => handleClick(star)}
              aria-label={readonly ? undefined : `Rate ${star} star${star > 1 ? "s" : ""}`}
            />
            {/* Star SVG */}
            <svg
              viewBox="0 0 20 20"
              width={px}
              height={px}
              className="block pointer-events-none"
              aria-hidden
            >
              <defs>
                <linearGradient id={`half-${uniqueId}`} x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="50%" stopColor="var(--gold)" />
                  <stop offset="50%" stopColor="var(--border)" />
                </linearGradient>
              </defs>
              <path
                d="M10 1l2.5 6.5L19 8l-5.5 4.5L14 19l-4-2.5L6 19l.5-6.5L1 8l6.5-.5L10 1z"
                fill={filled ? "var(--gold)" : half ? `url(#half-${uniqueId})` : "var(--border)"}
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
}
