"use client";

import * as React from "react";

const MIN = 0.5;
const MAX = 5;
const STEP = 0.5;

function snapToStep(v: number): number {
  const n = Math.round((v - MIN) / STEP) * STEP + MIN;
  return Math.max(MIN, Math.min(MAX, Math.round(n * 2) / 2));
}

export interface RatingDialProps {
  value: number | null;
  onChange?: (value: number | null) => void;
  size?: number;
  readonly?: boolean;
  className?: string;
}

export function RatingDial({
  value,
  onChange,
  size = 120,
  readonly = false,
  className = "",
}: RatingDialProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);

  const display = hoverValue ?? value ?? 0;
  const fillRatio = (display - MIN) / (MAX - MIN);
  const strokeWidth = Math.max(6, size / 12);
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - fillRatio);

  const angleToValue = React.useCallback((angleDeg: number) => {
    const normalized = ((angleDeg + 90) % 360 + 360) % 360;
    const ratio = normalized / 360;
    return snapToStep(MIN + ratio * (MAX - MIN));
  }, []);

  const getAngle = React.useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      return (Math.atan2(dy, dx) * 180) / Math.PI;
    },
    []
  );

  const handlePointer = React.useCallback(
    (clientX: number, clientY: number) => {
      if (readonly || !onChange) return;
      const angle = getAngle(clientX, clientY);
      if (angle === null) return;
      const next = angleToValue(angle);
      onChange(next);
    },
    [readonly, onChange, getAngle, angleToValue]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (readonly || !onChange) return;
    e.preventDefault();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    handlePointer(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const angle = getAngle(e.clientX, e.clientY);
    if (angle !== null) setHoverValue(angleToValue(angle));
    if (isDragging) handlePointer(e.clientX, e.clientY);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    setIsDragging(false);
  };

  const onPointerLeave = () => {
    setHoverValue(null);
    if (isDragging) setIsDragging(false);
  };

  return (
    <div className={`inline-flex flex-col items-center gap-2 ${className}`}>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        className={readonly ? "cursor-default" : "cursor-pointer touch-none"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerUp}
        aria-label={readonly ? undefined : "Set rating"}
        role={readonly ? undefined : "slider"}
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={value ?? undefined}
        aria-valuetext={value != null ? `${value} stars` : undefined}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          className="text-border"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--gold)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          className="text-gold transition-[stroke-dashoffset] duration-150"
        />
      </svg>
      <span className="text-lg font-semibold tabular-nums text-white">
        {display.toFixed(1)}
      </span>
    </div>
  );
}
