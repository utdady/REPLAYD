"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/chip";

/** NBA: Eastern Conference and Western Conference, each with own standings (same UX as football competition). */
const NBA_CONFERENCES = ["Eastern Conference", "Western Conference"] as const;
export type NBAConference = (typeof NBA_CONFERENCES)[number];

export function NBASection() {
  const [activeConference, setActiveConference] = useState<NBAConference>("Eastern Conference");

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-6">
        {NBA_CONFERENCES.map((conf) => (
          <Chip key={conf} active={activeConference === conf} onClick={() => setActiveConference(conf)}>
            {conf}
          </Chip>
        ))}
      </div>
      <div className="text-center text-muted py-12">
        Coming soon
      </div>
    </div>
  );
}
