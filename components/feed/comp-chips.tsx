"use client";

import { Chip } from "@/components/ui/chip";

const COMPETITIONS = ["All", "EPL", "UCL", "La Liga", "BL", "Serie A", "L1"];

export interface CompChipsProps {
  active: string;
  onSelect: (code: string) => void;
  className?: string;
}

export function CompChips({ active, onSelect, className = "" }: CompChipsProps) {
  return (
    <div className={`flex gap-1.5 px-4 overflow-x-auto scrollbar-hide ${className}`}>
      {COMPETITIONS.map((c) => (
        <Chip key={c} active={c === active} onClick={() => onSelect(c)}>
          {c}
        </Chip>
      ))}
    </div>
  );
}
