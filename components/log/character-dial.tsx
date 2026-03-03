"use client";

import * as React from "react";

export interface CharacterDialProps {
  value: number;
  max: number;
}

export function CharacterDial({ value, max }: CharacterDialProps) {
  const ratio = Math.min(1, value / max);
  const angle = ratio * 360;

  const background = `conic-gradient(#3ddc84 ${angle}deg, rgba(255,255,255,0.08) ${angle}deg)`;

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-[0.625rem] font-mono text-muted"
      style={{ background }}
      aria-label={`${value}/${max} characters`}
    >
      <div className="w-6 h-6 rounded-full bg-surface2 flex items-center justify-center border border-border/60">
        {max - value}
      </div>
    </div>
  );
}

