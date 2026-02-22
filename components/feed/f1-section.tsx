"use client";

import { useState } from "react";
import { startOfDay, format } from "date-fns";
import { Chip } from "@/components/ui/chip";
import { DateStrip } from "@/components/feed/date-strip";
import { SectionEyebrow } from "@/components/layout/section-eyebrow";

/** F1 standings: Drivers Championship and Constructors Championship (same pattern as football standings). */
const F1_VIEWS = ["Drivers Championship", "Constructors Championship"] as const;
export type F1View = (typeof F1_VIEWS)[number];

const standingsBtnClass =
  "min-w-[7rem] text-[.7rem] font-semibold tracking-[.05em] uppercase font-mono px-3 py-1.5 h-7 rounded-btn transition-colors border shrink-0";

export function F1Section() {
  const today = startOfDay(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [showStandings, setShowStandings] = useState(false);
  const [activeView, setActiveView] = useState<F1View>("Drivers Championship");

  const isToday = selectedDate.getTime() === today.getTime();

  return (
    <div className="pt-2 pb-8">
      <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} className="mt-4" />
      <div className={`px-4 pt-6 ${showStandings || isToday ? "mb-4" : ""}`}>
        <div className="flex items-center justify-between">
          {showStandings ? (
            <SectionEyebrow className="text-[1.75rem]">{activeView}</SectionEyebrow>
          ) : (
            <SectionEyebrow className="text-[1.75rem]">
              {isToday ? "Today" : format(selectedDate, "EEE d MMM")}
            </SectionEyebrow>
          )}
          <button
            onClick={() => setShowStandings((s) => !s)}
            className={`${standingsBtnClass} ${showStandings ? "bg-green text-black border-transparent" : "bg-surface2 text-muted border-border2 hover:text-white"}`}
          >
            Standings
          </button>
        </div>
      </div>
      {!showStandings ? (
        <div className="px-4 text-center text-muted py-12">Coming soon</div>
      ) : (
        <div className="px-4">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-6">
            {F1_VIEWS.map((view) => (
              <Chip key={view} active={activeView === view} onClick={() => setActiveView(view)}>
                {view}
              </Chip>
            ))}
          </div>
          <div className="text-center text-muted py-12">Coming soon</div>
        </div>
      )}
    </div>
  );
}
