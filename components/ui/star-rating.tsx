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

/** Convert 0–5 continuous to nearest half-step (0.5, 1, 1.5, …, 5). */
function toHalfStep(raw: number): number {
  const clamped = Math.max(0.5, Math.min(5, raw));
  return Math.round(clamped * 2) / 2;
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
  const containerRef = React.useRef<HTMLDivElement>(null);
  const display = hoverValue ?? value ?? 0;
  const baseId = React.useId();

  const getValueFromClientX = React.useCallback((clientX: number): number => {
    const el = containerRef.current;
    if (!el) return value ?? 0.5;
    const rect = el.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    return toHalfStep(ratio * 5);
  }, [value]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (readonly) return;
    setHoverValue(getValueFromClientX(e.clientX));
  };

  const handlePointerLeave = () => {
    setHoverValue(null);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (readonly || !onChange) return;
    const clickedValue = getValueFromClientX(e.clientX);
    const next = value === clickedValue ? null : clickedValue;
    onChange(next);
  };

  return (
    <div
      ref={containerRef}
      className={`inline-flex items-center gap-0.5 relative select-none ${className}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerUp={handlePointerUp}
      style={{ touchAction: "none" }}
      role={readonly ? undefined : "slider"}
      aria-label={readonly ? undefined : "Rating"}
      aria-valuemin={0.5}
      aria-valuemax={5}
      aria-valuenow={value ?? undefined}
      aria-valuetext={value != null ? `${value} stars` : undefined}
    >
      {/* Invisible larger hit area for touch; stars are drawn below */}
      {!readonly && (
        <div
          className="absolute inset-0 -top-2 -bottom-2 -left-1 -right-1 cursor-pointer"
          aria-hidden
        />
      )}
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = display >= star;
        const half = display >= star - 0.5 && display < star;
        const uniqueId = `${baseId}-${star}`;
        return (
          <div key={star} className="relative flex-shrink-0 pointer-events-none" style={{ width: px, height: px }}>
            <svg
              viewBox="0 0 20 20"
              width={px}
              height={px}
              className="block"
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
