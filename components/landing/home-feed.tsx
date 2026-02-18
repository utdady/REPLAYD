"use client";

import { useState, useEffect } from "react";
import { startOfDay, format } from "date-fns";
import { CompChips } from "@/components/feed/comp-chips";
import { DateStrip } from "@/components/feed/date-strip";
import { ScrollRow } from "@/components/feed/scroll-row";
import { MatchCard } from "@/components/match/match-card";
import { MatchPoster } from "@/components/match/match-poster";
import { SectionEyebrow } from "@/components/layout/section-eyebrow";
import { getMatchesForFeed } from "@/app/actions/feed";
import { FEED_SEASON_YEAR } from "@/lib/feed-constants";

/** DB competition code → display label for chips/badges */
const CODE_TO_LABEL: Record<string, string> = {
  PL: "EPL",
  CL: "UCL",
  PD: "La Liga",
  BL1: "BL",
  SA: "Serie A",
  FL1: "L1",
};

const POPULAR = [
  { id: "p1", competition: "EPL", home: { name: "Liverpool", crest: "🔴" }, away: { name: "Man City", crest: "🔵" }, homeScore: 3, awayScore: 2 },
  { id: "p2", competition: "La Liga", home: { name: "Barcelona", crest: "🔵" }, away: { name: "Real Madrid", crest: "⚪" }, homeScore: 1, awayScore: 1 },
];
const FROM_FRIENDS = [
  { id: "f1", competition: "UCL", home: { name: "Inter", crest: "🔵" }, away: { name: "Atlético", crest: "🔴" }, homeScore: 2, awayScore: 0, friend: { username: "footy_fan", avatarUrl: null } },
];

function formatDateLabel(utcIso: string): string {
  return format(new Date(utcIso), "EEE d MMM");
}
function formatTime(utcIso: string): string {
  return format(new Date(utcIso), "HH:mm");
}

export function HomeFeed() {
  const currentYear = new Date().getFullYear();
  const today = startOfDay(new Date());
  
  // Default to today's date and current year
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeComp, setActiveComp] = useState("All");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear); // Default to current year
  const [matches, setMatches] = useState<Awaited<ReturnType<typeof getMatchesForFeed>>>([]);
  const [loading, setLoading] = useState(true);

  const dateYmd = format(selectedDate, "yyyy-MM-dd");
  const isToday = selectedDate.getTime() === today.getTime();

  // When year changes, if selectedDate is not in that year, adjust it to today (if today is in that year) or Jan 1 of that year
  // This ensures the date strip shows dates from the selected year
  useEffect(() => {
    const selectedDateYear = selectedDate.getFullYear();
    if (selectedDateYear !== selectedYear) {
      const todayYear = today.getFullYear();
      if (todayYear === selectedYear) {
        // If changing to current year, use today's date
        setSelectedDate(today);
      } else {
        // Otherwise, use Jan 1 of the selected year
        setSelectedDate(startOfDay(new Date(selectedYear, 0, 1)));
      }
    }
  }, [selectedYear]); // Only depend on selectedYear, not selectedDate to avoid loops

  useEffect(() => {
    setLoading(true);
    getMatchesForFeed(dateYmd, activeComp, selectedYear)
      .then(setMatches)
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, [dateYmd, activeComp, selectedYear]);

  // Helper function to format season year into season label (e.g. 2024 -> "2024/25")
  const formatSeasonLabel = (seasonYear: number | null | undefined): string | null => {
    if (!seasonYear || typeof seasonYear !== 'number') {
      return null;
    }
    return `${seasonYear}/${String(seasonYear + 1).slice(-2)}`;
  };

  return (
    <div className="pt-20 md:pt-24">
      <div className="max-w-2xl mx-auto">
        <CompChips active={activeComp} onSelect={setActiveComp} />
        <DateStrip
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          selectedYear={selectedYear}
          onSelectYear={setSelectedYear}
          yearOptions={[currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2]}
        />
        <section className="px-4 pt-6 pb-8">
          <SectionEyebrow>{isToday ? "Today" : format(selectedDate, "EEE d MMM")}</SectionEyebrow>
          <h2 className="font-display text-3xl md:text-4xl tracking-wide mt-2 mb-4" style={{ letterSpacing: "0.02em" }}>
            {isToday ? "TODAY'S MATCHES" : "MATCHES"}
          </h2>
          {loading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : matches.length === 0 ? (
            <p className="text-sm text-muted">No matches on this date for {selectedYear}.</p>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => (
                <MatchCard
                  key={m.id}
                  id={String(m.id)}
                  competition={CODE_TO_LABEL[m.competition_code] ?? m.competition_name}
                  season={formatSeasonLabel(m.season_year)}
                  dateLabel={formatDateLabel(m.utc_date)}
                  time={formatTime(m.utc_date)}
                  home={{
                    id: String(m.home_team_id),
                    name: m.home_team_name,
                    crest: m.home_crest_url ?? undefined,
                  }}
                  away={{
                    id: String(m.away_team_id),
                    name: m.away_team_name,
                    crest: m.away_crest_url ?? undefined,
                  }}
                  homeScore={m.home_score}
                  awayScore={m.away_score}
                  isLive={m.status === "IN_PLAY" || m.status === "PAUSED"}
                  minute={null}
                />
              ))}
            </div>
          )}
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
