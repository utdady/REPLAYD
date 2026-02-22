"use client";

import { useState } from "react";
import { startOfDay, format } from "date-fns";
import { Chip } from "@/components/ui/chip";
import { DateStrip } from "@/components/feed/date-strip";
import { SectionEyebrow } from "@/components/layout/section-eyebrow";

/** NFL: AFC and NFC; each has four divisions: North, South, East, West. */
const NFL_CONFERENCES = ["AFC", "NFC"] as const;
const NFL_DIVISIONS = ["North", "South", "East", "West"] as const;

export type NFLConference = (typeof NFL_CONFERENCES)[number];
export type NFLDivision = (typeof NFL_DIVISIONS)[number];

const standingsBtnClass =
  "min-w-[7rem] text-[.7rem] font-semibold tracking-[.05em] uppercase font-mono px-3 py-1.5 h-7 rounded-btn transition-colors border shrink-0";

export function NFLSection() {
  const today = startOfDay(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [showStandings, setShowStandings] = useState(false);
  const [activeConference, setActiveConference] = useState<NFLConference | null>(null);
  const [activeDivision, setActiveDivision] = useState<NFLDivision>("North");

  const isToday = selectedDate.getTime() === today.getTime();

  const standingsLabel =
    showStandings && activeConference ? `${activeConference} ${activeDivision}` : showStandings ? "Standings" : null;

  return (
    <div className="pt-2 pb-8">
      <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} className="mt-4" />
      <div className={`px-4 pt-6 ${showStandings || isToday ? "mb-4" : ""}`}>
        <div className="flex items-center justify-between">
          {showStandings && standingsLabel ? (
            <SectionEyebrow className="text-[1.75rem]">{standingsLabel}</SectionEyebrow>
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
          <div className="text-center text-muted py-12">Coming soon</div>
        </div>
      )}
    </div>
  );
}
