"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/chip";

/** NFL: AFC and NFC; each has four divisions: North, South, East, West. */
const NFL_CONFERENCES = ["AFC", "NFC"] as const;
const NFL_DIVISIONS = ["North", "South", "East", "West"] as const;

export type NFLConference = (typeof NFL_CONFERENCES)[number];
export type NFLDivision = (typeof NFL_DIVISIONS)[number];

export function NFLSection() {
  const [activeConference, setActiveConference] = useState<NFLConference | null>(null);
  const [activeDivision, setActiveDivision] = useState<NFLDivision>("North");

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-4">
        {NFL_CONFERENCES.map((conf) => (
          <Chip
            key={conf}
            active={activeConference === conf}
            onClick={() => setActiveConference(conf)}
          >
            {conf}
          </Chip>
        ))}
      </div>
      {activeConference && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-6">
          {NFL_DIVISIONS.map((div) => (
            <Chip
              key={div}
              active={activeDivision === div}
              onClick={() => setActiveDivision(div)}
            >
              {div}
            </Chip>
          ))}
        </div>
      )}
      <div className="text-center text-muted py-12">
        Coming soon
      </div>
    </div>
  );
}
