"use client";

import { Chip } from "@/components/ui/chip";

export type SportId = "football" | "f1" | "nfl" | "nba";

const SPORTS: { id: SportId; label: string; comingSoon: boolean }[] = [
  { id: "football", label: "Football", comingSoon: false },
  { id: "f1", label: "F1", comingSoon: true },
  { id: "nfl", label: "NFL", comingSoon: true },
  { id: "nba", label: "NBA", comingSoon: true },
];

export interface SportChipsProps {
  active: SportId;
  onSelect: (sport: SportId) => void;
  className?: string;
}

export function SportChips({ active, onSelect, className = "" }: SportChipsProps) {
  return (
    <div className={`flex gap-1.5 px-4 overflow-x-auto scrollbar-hide ${className}`}>
      {SPORTS.map((s) => (
        <Chip
          key={s.id}
          active={active === s.id}
          onClick={() => onSelect(s.id)}
          comingSoon={s.comingSoon}
        >
          {s.label}
        </Chip>
      ))}
    </div>
  );
}
