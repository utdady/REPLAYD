"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/chip";

/** F1 standings: Drivers Championship and Constructors Championship (same pattern as football standings). */
const F1_VIEWS = ["Drivers Championship", "Constructors Championship"] as const;
export type F1View = (typeof F1_VIEWS)[number];

export function F1Section() {
  const [activeView, setActiveView] = useState<F1View>("Drivers Championship");

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-6">
        {F1_VIEWS.map((view) => (
          <Chip key={view} active={activeView === view} onClick={() => setActiveView(view)}>
            {view}
          </Chip>
        ))}
      </div>
      <div className="text-center text-muted py-12">
        Coming soon
      </div>
    </div>
  );
}
