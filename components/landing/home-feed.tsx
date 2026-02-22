"use client";

import { useState, useEffect } from "react";
import { startOfDay, format } from "date-fns";
import { CompChips } from "@/components/feed/comp-chips";
import { DateStrip } from "@/components/feed/date-strip";
import { ScrollRow } from "@/components/feed/scroll-row";
import { MatchCard } from "@/components/match/match-card";
import { MatchPoster } from "@/components/match/match-poster";
import { SectionEyebrow } from "@/components/layout/section-eyebrow";
import { getMatchesForFeed, getStandings } from "@/app/actions/feed";
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

const COMPS_WITHOUT_STANDINGS = new Set(["All", "UCL"]);

function formatDateLabel(utcIso: string): string {
  return format(new Date(utcIso), "EEE d MMM");
}
function formatTime(utcIso: string): string {
  return format(new Date(utcIso), "HH:mm");
}

type StandingRow = Awaited<ReturnType<typeof getStandings>>[number];

export function HomeFeed() {
  const today = startOfDay(new Date());

  const [selectedDate, setSelectedDate] = useState(today);
  const [activeComp, setActiveComp] = useState("All");
  const [matches, setMatches] = useState<Awaited<ReturnType<typeof getMatchesForFeed>>>([]);
  const [loading, setLoading] = useState(true);

  const [showStandings, setShowStandings] = useState(false);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);

  const dateYmd = format(selectedDate, "yyyy-MM-dd");
  const isToday = selectedDate.getTime() === today.getTime();
  const hasStandings = !COMPS_WITHOUT_STANDINGS.has(activeComp);

  useEffect(() => {
    setLoading(true);
    getMatchesForFeed(dateYmd, activeComp, selectedDate.getFullYear())
      .then(setMatches)
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, [dateYmd, activeComp, selectedDate.getTime()]);

  useEffect(() => {
    if (!hasStandings) {
      setShowStandings(false);
      setStandings([]);
      return;
    }
    if (showStandings && standings.length === 0) {
      setStandingsLoading(true);
      getStandings(activeComp)
        .then(setStandings)
        .catch(() => setStandings([]))
        .finally(() => setStandingsLoading(false));
    }
  }, [showStandings, activeComp, hasStandings]);

  // Reset standings when comp changes
  useEffect(() => {
    setShowStandings(false);
    setStandings([]);
  }, [activeComp]);

  const formatSeasonLabel = (seasonYear: number | null | undefined): string | null => {
    if (!seasonYear || typeof seasonYear !== "number") return null;
    return `${seasonYear}/${String(seasonYear + 1).slice(-2)}`;
  };

  const renderFormDots = (form: string | null) => {
    if (!form) return null;
    return (
      <div className="flex gap-1">
        {form.split(",").slice(-5).map((r, i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full ${
              r.trim() === "W" ? "bg-green" : r.trim() === "D" ? "bg-yellow-400" : "bg-[#f43f5e]"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="pt-20 md:pt-24">
      <div className="max-w-2xl mx-auto">
        <CompChips active={activeComp} onSelect={setActiveComp} />
        <DateStrip
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          className="mt-4"
        />
        <section className="px-4 pt-6 pb-8">
          {!showStandings && (
            <div className={`flex items-center justify-between ${isToday ? "mb-4" : ""}`}>
              <SectionEyebrow>{isToday ? "Today" : format(selectedDate, "EEE d MMM")}</SectionEyebrow>
              {hasStandings && (
                <button
                  onClick={() => setShowStandings(true)}
                  className="text-[.7rem] font-semibold tracking-[.05em] uppercase font-mono px-3 py-1.5 h-7 rounded-btn transition-colors bg-surface2 text-muted border border-border2 hover:text-white"
                >
                  Standings
                </button>
              )}
            </div>
          )}
          {!(showStandings === false && isToday) && (
            <div className="flex items-center justify-between mt-2 mb-4">
              {showStandings ? (
                <span className="text-[.7rem] font-semibold tracking-[.05em] uppercase font-mono text-white">
                  STANDINGS
                </span>
              ) : (
                <h2 className="font-display text-3xl md:text-4xl tracking-wide" style={{ letterSpacing: "0.02em" }}>
                  GAMES
                </h2>
              )}
              {showStandings && (
                <button
                  onClick={() => setShowStandings(false)}
                  className="text-[.7rem] font-semibold tracking-[.05em] uppercase font-mono px-3 py-1.5 h-7 rounded-btn border border-transparent bg-green text-black transition-colors"
                >
                  Standings
                </button>
              )}
            </div>
          )}

          {showStandings ? (
            standingsLoading ? (
              <p className="text-sm text-muted">Loading standings…</p>
            ) : standings.length === 0 ? (
              <p className="text-sm text-muted">No standings data available yet.</p>
            ) : (
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full min-w-[560px] text-[.78rem]">
                  <thead>
                    <tr className="text-muted font-mono text-[.65rem] tracking-[.08em] uppercase border-b border-border">
                      <th className="text-left py-2 pr-2 w-8">#</th>
                      <th className="text-left py-2 pr-2">Team</th>
                      <th className="text-center py-2 px-1 w-8">P</th>
                      <th className="text-center py-2 px-1 w-8">W</th>
                      <th className="text-center py-2 px-1 w-8">D</th>
                      <th className="text-center py-2 px-1 w-8">L</th>
                      <th className="text-center py-2 px-1 w-8">GF</th>
                      <th className="text-center py-2 px-1 w-8">GA</th>
                      <th className="text-center py-2 px-1 w-10">GD</th>
                      <th className="text-center py-2 px-1 w-10 font-bold">Pts</th>
                      <th className="text-center py-2 pl-1 w-16">Form</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row) => (
                      <tr key={row.team_id} className="border-b border-border/50 hover:bg-surface2/50 transition-colors">
                        <td className="py-2.5 pr-2 text-muted font-mono">{row.position}</td>
                        <td className="py-2.5 pr-2">
                          <div className="flex items-center gap-2">
                            {row.crest_url ? (
                              <img src={row.crest_url} alt="" className="w-5 h-5 object-contain shrink-0" />
                            ) : (
                              <div className="w-5 h-5 rounded bg-surface3 shrink-0" />
                            )}
                            <span className="text-white font-medium truncate max-w-[140px]">
                              {row.short_name || row.team_name}
                            </span>
                          </div>
                        </td>
                        <td className="text-center py-2.5 px-1 text-muted">{row.played_games}</td>
                        <td className="text-center py-2.5 px-1 text-muted">{row.won}</td>
                        <td className="text-center py-2.5 px-1 text-muted">{row.draw}</td>
                        <td className="text-center py-2.5 px-1 text-muted">{row.lost}</td>
                        <td className="text-center py-2.5 px-1 text-muted">{row.goals_for}</td>
                        <td className="text-center py-2.5 px-1 text-muted">{row.goals_against}</td>
                        <td className="text-center py-2.5 px-1 text-white">
                          {row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}
                        </td>
                        <td className="text-center py-2.5 px-1 text-white font-bold">{row.points}</td>
                        <td className="py-2.5 pl-1">
                          <div className="flex justify-center">{renderFormDots(row.form)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : loading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : matches.length === 0 ? (
            <p className="text-sm text-muted">No games on this date.</p>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => (
                <MatchCard
                  key={m.id}
                  id={String(m.id)}
                  competition={CODE_TO_LABEL[m.competition_code] ?? m.competition_name}
                  season={formatSeasonLabel(FEED_SEASON_YEAR)}
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
