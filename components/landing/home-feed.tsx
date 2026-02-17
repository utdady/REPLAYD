"use client";

import { useState } from "react";
import { startOfDay } from "date-fns";
import { CompChips } from "@/components/feed/comp-chips";
import { DateStrip } from "@/components/feed/date-strip";
import { ScrollRow } from "@/components/feed/scroll-row";
import { MatchCard } from "@/components/match/match-card";
import { MatchPoster } from "@/components/match/match-poster";
import { SectionEyebrow } from "@/components/layout/section-eyebrow";

const TODAY_MATCHES = [
  { id: "m1", competition: "EPL", home: { id: "t1", name: "Arsenal", crest: "🔴" }, away: { id: "t2", name: "Chelsea", crest: "🔵" }, homeScore: 2, awayScore: 1, isLive: false, minute: null, time: "15:00" },
  { id: "m2", competition: "UCL", home: { id: "t3", name: "Real Madrid", crest: "⚪" }, away: { id: "t4", name: "Bayern Munich", crest: "🔴" }, homeScore: null, awayScore: null, isLive: false, minute: null, time: "20:00" },
];
const POPULAR = [
  { id: "p1", competition: "EPL", home: { name: "Liverpool", crest: "🔴" }, away: { name: "Man City", crest: "🔵" }, homeScore: 3, awayScore: 2 },
  { id: "p2", competition: "La Liga", home: { name: "Barcelona", crest: "🔵" }, away: { name: "Real Madrid", crest: "⚪" }, homeScore: 1, awayScore: 1 },
];
const FROM_FRIENDS = [
  { id: "f1", competition: "UCL", home: { name: "Inter", crest: "🔵" }, away: { name: "Atlético", crest: "🔴" }, homeScore: 2, awayScore: 0, friend: { username: "footy_fan", avatarUrl: null } },
];

export function HomeFeed() {
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [activeComp, setActiveComp] = useState("All");

  return (
    <div className="pt-20 md:pt-24">
      <div className="max-w-2xl mx-auto">
        <CompChips active={activeComp} onSelect={setActiveComp} />
        <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        <section className="px-4 pt-6 pb-8">
          <SectionEyebrow>Today</SectionEyebrow>
          <h2 className="font-display text-3xl md:text-4xl tracking-wide mt-2 mb-4" style={{ letterSpacing: "0.02em" }}>
            TODAY&apos;S MATCHES
          </h2>
          <div className="space-y-3">
            {TODAY_MATCHES.map((m) => (
              <MatchCard key={m.id} id={m.id} competition={m.competition} home={m.home} away={m.away} homeScore={m.homeScore} awayScore={m.awayScore} isLive={m.isLive} minute={m.minute} time={m.time} />
            ))}
          </div>
        </section>
        <ScrollRow title="Popular this week" seeAllHref="/matches?sort=popular">
          {POPULAR.map((m) => (
            <MatchPoster key={m.id} id={m.id} competition={m.competition} home={m.home} away={m.away} homeScore={m.homeScore} awayScore={m.awayScore} />
          ))}
        </ScrollRow>
        <ScrollRow title="New from friends" seeAllHref="/activity" className="pt-6 pb-12">
          {FROM_FRIENDS.map((m) => (
            <MatchPoster key={m.id} id={m.id} competition={m.competition} home={m.home} away={m.away} homeScore={m.homeScore} awayScore={m.awayScore} friend={m.friend} />
          ))}
        </ScrollRow>
      </div>
    </div>
  );
}
