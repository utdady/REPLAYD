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
  const [hover, setHover] = React.useState<number | null>(null);
  const display = hover ?? value ?? 0;

  const handleClick = (star: number) => {
    if (readonly || !onChange) return;
    const next = value === star ? null : star;
    onChange(next);
  };

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`}
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = display >= star;
        const half = display >= star - 0.5 && display < star;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={readonly ? "cursor-default" : "cursor-pointer"}
            onMouseEnter={() => !readonly && setHover(star)}
            onClick={() => handleClick(star)}
            style={{ width: px, height: px }}
            aria-label={readonly ? undefined : `Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <svg
              viewBox="0 0 20 20"
              width={px}
              height={px}
              className="block"
              aria-hidden
            >
              {half ? (
                <defs>
                  <linearGradient id={`half-${star}`} x1="0" x2="1" y1="0" y2="0">
                    <stop offset="50%" stopColor="var(--gold)" />
                    <stop offset="50%" stopColor="var(--border)" />
                  </linearGradient>
                </defs>
              ) : null}
              <path
                d="M10 1l2.5 6.5L19 8l-5.5 4.5L14 19l-4-2.5L6 19l.5-6.5L1 8l6.5-.5L10 1z"
                fill={filled ? "var(--gold)" : half ? `url(#half-${star})` : "var(--border)"}
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
