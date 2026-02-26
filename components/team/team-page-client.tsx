"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  getTeamOverview,
  getTeamMatches,
  getTeamTablesFull,
  toggleFavoriteTeam,
  type TeamRow,
  type TeamOverviewResult,
  type TeamMatchRow,
  type TeamTableFull,
  type TeamStandingRow,
} from "@/app/actions/team";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchScore } from "@/components/match/match-score";

const CODE_TO_LABEL: Record<string, string> = {
  PL: "EPL",
  CL: "UCL",
  PD: "La Liga",
  BL1: "BL",
  SA: "Serie A",
  FL1: "L1",
};

function renderFormDots(form: string | null) {
  if (!form) return null;
  return (
    <div className="flex gap-1 justify-center">
      {form.split(",").slice(-5).map((r, i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full shrink-0 ${
            r.trim() === "W" ? "bg-green" : r.trim() === "D" ? "bg-yellow-400" : "bg-[#f43f5e]"
          }`}
        />
      ))}
    </div>
  );
}

type TabId = "overview" | "matches" | "table" | "stats" | "squad";

export interface TeamPageClientProps {
  team: TeamRow;
  teamId: number;
  seasons: number[];
  initialSeason: number;
  initialFavorited: boolean;
}

export function TeamPageClient({
  team,
  teamId,
  seasons,
  initialSeason,
  initialFavorited,
}: TeamPageClientProps) {
  const router = useRouter();
  const [tab, setTab] = React.useState<TabId>("overview");
  const [season, setSeason] = React.useState(initialSeason);
  const [favorited, setFavorited] = React.useState(initialFavorited);
  const [overview, setOverview] = React.useState<TeamOverviewResult | null>(null);
  const [matches, setMatches] = React.useState<TeamMatchRow[] | null>(null);
  const [tableFull, setTableFull] = React.useState<TeamTableFull[] | null>(null);
  const [loadingOverview, setLoadingOverview] = React.useState(false);
  const [loadingMatches, setLoadingMatches] = React.useState(false);
  const [loadingTable, setLoadingTable] = React.useState(false);
  const currentMatchRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (tab === "overview") {
      setLoadingOverview(true);
      getTeamOverview(teamId, season)
        .then(setOverview)
        .finally(() => setLoadingOverview(false));
    }
  }, [tab, teamId, season]);

  React.useEffect(() => {
    if (tab === "matches") {
      setLoadingMatches(true);
      getTeamMatches(teamId, season)
        .then((list) => {
          setMatches(list);
        })
        .finally(() => setLoadingMatches(false));
    }
  }, [tab, teamId, season]);

  React.useEffect(() => {
    if (tab === "matches" && matches && matches.length > 0 && currentMatchRef.current) {
      currentMatchRef.current.scrollIntoView({ block: "center", behavior: "auto" });
    }
  }, [tab, matches]);

  React.useEffect(() => {
    if (tab === "table") {
      setLoadingTable(true);
      getTeamTablesFull(teamId, season)
        .then(setTableFull)
        .finally(() => setLoadingTable(false));
    }
  }, [tab, teamId, season]);

  const handleToggleFavorite = async () => {
    const result = await toggleFavoriteTeam(teamId);
    if (result.ok) {
      setFavorited(result.favorited);
      router.refresh();
    }
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "matches", label: "Matches" },
    { id: "table", label: "Table" },
    { id: "stats", label: "Stats" },
    { id: "squad", label: "Squad" },
  ];

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-2xl mx-auto px-4">
        <header className="flex items-center justify-between gap-4 py-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2 text-sm font-mono text-muted hover:text-white shrink-0">
            <span aria-hidden>←</span>
            Back
          </Link>
          <Button
            type="button"
            variant={favorited ? "primary" : "outline"}
            className="shrink-0"
            onClick={handleToggleFavorite}
          >
            {favorited ? "Following" : "Follow"}
          </Button>
        </header>

        <div className="flex items-center gap-4 py-6">
          {team.crest_url ? (
            <img src={team.crest_url} alt="" className="w-16 h-16 rounded-full object-contain bg-surface3 shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-surface3 shrink-0" />
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-sans font-semibold text-white truncate">{team.name}</h1>
            {team.short_name || team.tla ? (
              <p className="text-sm text-muted">{team.short_name ?? team.tla}</p>
            ) : null}
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto pb-px border-b border-border -mx-4 px-4" aria-label="Team sections">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 py-2 px-3 text-sm font-medium rounded-t transition-colors ${
                tab === t.id ? "text-white border-b-2 border-green bg-surface2/50" : "text-muted hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "overview" && (
          <div className="py-6 space-y-6">
            {loadingOverview ? (
              <p className="text-sm text-muted">Loading…</p>
            ) : overview ? (
              <>
                {overview.nextMatch && (
                  <section>
                    <h2 className="text-xs font-mono font-semibold tracking-wider uppercase text-muted mb-2">Next match</h2>
                    <Link
                      href={`/matches/${overview.nextMatch.id}`}
                      className="block p-3.5 rounded-card bg-surface2 border border-border hover:border-border2 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-2 mb-2.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge>{CODE_TO_LABEL[overview.nextMatch.competition_code] ?? overview.nextMatch.competition_name}</Badge>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-muted">
                              {season}/{String(season + 1).slice(-2)}
                            </span>
                          </div>
                        </div>
                        <span className="text-sm font-mono text-muted shrink-0">
                          {format(new Date(overview.nextMatch.utc_date), "EEE d MMM")}
                          {" · "}
                          {overview.nextMatch.status === "FINISHED"
                            ? `${overview.nextMatch.home_score}–${overview.nextMatch.away_score}`
                            : format(new Date(overview.nextMatch.utc_date), "HH:mm")}
                        </span>
                      </div>
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {overview.nextMatch.home_crest_url ? (
                            <img src={overview.nextMatch.home_crest_url} alt="" className="w-6 h-6 object-contain shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded bg-surface3 shrink-0" />
                          )}
                          <span className="truncate text-sm font-sans text-white">{overview.nextMatch.home_team_name}</span>
                        </div>
                        <MatchScore
                          home={overview.nextMatch.home_score}
                          away={overview.nextMatch.away_score}
                          scheduled={overview.nextMatch.status !== "FINISHED"}
                        />
                        <div className="flex items-center gap-2 min-w-0 justify-end">
                          <span className="truncate text-sm font-sans text-white text-right">{overview.nextMatch.away_team_name}</span>
                          {overview.nextMatch.away_crest_url ? (
                            <img src={overview.nextMatch.away_crest_url} alt="" className="w-6 h-6 object-contain shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded bg-surface3 shrink-0" />
                          )}
                        </div>
                      </div>
                    </Link>
                  </section>
                )}
                {overview.form.length > 0 && (
                  <section>
                    <h2 className="text-xs font-mono font-semibold tracking-wider uppercase text-muted mb-2">Team form</h2>
                    <div className="flex gap-3">
                      {overview.form.map((f) => {
                        const isHome = f.home_team_id === teamId;
                        const ourScore = isHome ? f.home_score : f.away_score;
                        const oppScore = isHome ? f.away_score : f.home_score;
                        const scoreLabel = [ourScore ?? "-", oppScore ?? "-"].join(" – ");
                        const chipGreen = f.result === "W" || f.result === "L";
                        return (
                          <Link
                            key={f.match_id}
                            href={`/matches/${f.match_id}`}
                            className="flex flex-col items-center gap-2 shrink-0 hover:opacity-90 transition-opacity"
                          >
                            <span
                              className={`min-w-[3rem] px-2 py-1 rounded flex items-center justify-center text-xs font-bold text-white ${
                                chipGreen ? "bg-green" : "bg-surface3 text-muted"
                              }`}
                              title={format(new Date(f.utc_date), "EEE d MMM")}
                            >
                              {scoreLabel}
                            </span>
                            {f.opponent_crest_url ? (
                              <img src={f.opponent_crest_url} alt="" className="w-8 h-8 object-contain" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-surface3" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                )}
                {overview.mostWatchedMatch && (
                  <section>
                    <h2 className="text-xs font-mono font-semibold tracking-wider uppercase text-muted mb-2">Most watched game</h2>
                    <Link
                      href={`/matches/${overview.mostWatchedMatch.id}`}
                      className="block p-4 rounded-card bg-surface2 border border-border hover:border-border2 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-sm text-muted">{format(new Date(overview.mostWatchedMatch.utc_date), "EEE d MMM")}</span>
                        <Badge>{CODE_TO_LABEL[overview.mostWatchedMatch.competition_code] ?? overview.mostWatchedMatch.competition_name}</Badge>
                      </div>
                      <p className="text-sm text-white">
                        {overview.mostWatchedMatch.home_team_name} {overview.mostWatchedMatch.home_score}–{overview.mostWatchedMatch.away_score} {overview.mostWatchedMatch.away_team_name}
                      </p>
                    </Link>
                  </section>
                )}
                {overview.highestRatedMatch && (
                  <section>
                    <h2 className="text-xs font-mono font-semibold tracking-wider uppercase text-muted mb-2">Highest rated game</h2>
                    <Link
                      href={`/matches/${overview.highestRatedMatch.id}`}
                      className="block p-4 rounded-card bg-surface2 border border-border hover:border-border2 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-sm text-muted">{format(new Date(overview.highestRatedMatch.utc_date), "EEE d MMM")}</span>
                        <Badge>{CODE_TO_LABEL[overview.highestRatedMatch.competition_code] ?? overview.highestRatedMatch.competition_name}</Badge>
                      </div>
                      <p className="text-sm text-white">
                        {overview.highestRatedMatch.home_team_name} {overview.highestRatedMatch.home_score}–{overview.highestRatedMatch.away_score} {overview.highestRatedMatch.away_team_name}
                      </p>
                    </Link>
                  </section>
                )}
              </>
            ) : (
              <p className="text-sm text-muted">No overview data for this season.</p>
            )}
          </div>
        )}

        {tab === "matches" && (
          <div className="py-6">
            <div className="flex items-center gap-2 mb-4">
              <label className="text-sm text-muted">Season</label>
              <select
                value={season}
                onChange={(e) => setSeason(Number(e.target.value))}
                className="px-3 py-2 rounded-btn bg-surface2 border border-border text-white text-sm focus:outline-none focus:border-border2"
              >
                {seasons.map((y) => (
                  <option key={y} value={y}>{y}/{String(y + 1).slice(-2)}</option>
                ))}
              </select>
            </div>
            {loadingMatches ? (
              <p className="text-sm text-muted">Loading matches…</p>
            ) : matches && matches.length > 0 ? (
              (() => {
                const now = Date.now();
                const currentIndex = (() => {
                  const idx = matches.findIndex((m) => new Date(m.utc_date).getTime() >= now);
                  return idx >= 0 ? idx : matches.length - 1;
                })();
                const scheduled = (m: TeamMatchRow) => m.status !== "FINISHED" && m.status !== "IN_PLAY" && m.status !== "PAUSED";
                const byDate = matches.reduce<Record<string, TeamMatchRow[]>>((acc, m) => {
                  const key = format(new Date(m.utc_date), "yyyy-MM-dd");
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(m);
                  return acc;
                }, {});
                const dateKeys = Object.keys(byDate).sort();
                return (
              <div className="space-y-6">
                {dateKeys.map((dateKey) => (
                  <section key={dateKey}>
                    <h2 className="text-xs font-mono font-semibold tracking-wider uppercase text-muted mb-2">
                      {format(new Date(dateKey), "EEE, MMM d")}
                    </h2>
                    <div className="space-y-3">
                      {byDate[dateKey].map((m) => {
                        const isScheduled = scheduled(m);
                        const scoreBox = isScheduled ? (
                          <span className="inline-flex items-center justify-center min-w-[3.5rem] px-2 py-1 rounded bg-green text-white font-display text-lg font-bold" style={{ letterSpacing: "0.02em" }}>
                            VS
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center min-w-[3.5rem] px-2 py-1 rounded bg-green text-white font-display text-lg font-bold" style={{ letterSpacing: "0.02em" }}>
                            {m.home_score ?? 0} – {m.away_score ?? 0}
                          </span>
                        );
                        return (
                          <div key={m.id} ref={matches.indexOf(m) === currentIndex ? currentMatchRef : undefined}>
                            <Link href={`/matches/${m.id}`}>
                              <article className="bg-surface2 border border-border rounded-card p-3.5 hover:border-border2 transition-colors">
                                <div className="flex justify-between items-start gap-2 mb-2.5">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge>{CODE_TO_LABEL[m.competition_code] ?? m.competition_name}</Badge>
                                      {m.watched && (
                                        <span className="text-[10px] font-mono text-green uppercase">Watched</span>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-sm font-mono text-muted shrink-0">
                                    {format(new Date(m.utc_date), "EEE, MMM d")}
                                    {new Date(m.utc_date) >= new Date() && ` · ${format(new Date(m.utc_date), "HH:mm")}`}
                                  </span>
                                </div>
                                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="truncate text-sm font-sans text-white">{m.home_team_name}</span>
                                    {m.home_crest_url ? <img src={m.home_crest_url} alt="" className="w-6 h-6 object-contain shrink-0" /> : <div className="w-6 h-6 rounded bg-surface3 shrink-0" />}
                                  </div>
                                  {scoreBox}
                                  <div className="flex items-center gap-2 min-w-0 justify-end">
                                    {m.away_crest_url ? <img src={m.away_crest_url} alt="" className="w-6 h-6 object-contain shrink-0" /> : <div className="w-6 h-6 rounded bg-surface3 shrink-0" />}
                                    <span className="truncate text-sm font-sans text-white text-right">{m.away_team_name}</span>
                                  </div>
                                </div>
                              </article>
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
                );
              })()
            ) : (
              <p className="text-sm text-muted">No matches for this season.</p>
            )}
          </div>
        )}

        {tab === "table" && (
          <div className="py-6">
            <div className="flex items-center gap-2 mb-4">
              <label className="text-sm text-muted">Season</label>
              <select
                value={season}
                onChange={(e) => setSeason(Number(e.target.value))}
                className="px-3 py-2 rounded-btn bg-surface2 border border-border text-white text-sm focus:outline-none focus:border-border2"
              >
                {seasons.map((y) => (
                  <option key={y} value={y}>{y}/{String(y + 1).slice(-2)}</option>
                ))}
              </select>
            </div>
            {loadingTable ? (
              <p className="text-sm text-muted">Loading table…</p>
            ) : tableFull && tableFull.length > 0 ? (
              <div className="space-y-8">
                {tableFull.map((table) => (
                  <section key={table.competition_id}>
                    <h2 className="text-sm font-mono font-semibold text-muted mb-3">{table.competition_name}</h2>
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
                          {table.rows.map((row: TeamStandingRow) => (
                            <tr
                              key={row.team_id}
                              className={`border-b border-border/50 transition-colors ${
                                row.is_highlight ? "bg-green/10 border-l-2 border-l-green" : "hover:bg-surface2/50"
                              }`}
                            >
                              <td className="py-2.5 pr-2 text-muted font-mono font-bold">{row.position}</td>
                              <td className="py-2.5 pr-2">
                                <Link href={`/teams/${row.team_id}`} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                                  {row.crest_url ? (
                                    <img src={row.crest_url} alt="" className="w-5 h-5 object-contain shrink-0" />
                                  ) : (
                                    <div className="w-5 h-5 rounded bg-surface3 shrink-0" />
                                  )}
                                  <span className="text-white font-medium truncate max-w-[140px]">
                                    {row.short_name || row.team_name}
                                  </span>
                                </Link>
                              </td>
                              <td className="text-center py-2.5 px-1 text-muted">{row.played_games}</td>
                              <td className="text-center py-2.5 px-1 text-muted">{row.won}</td>
                              <td className="text-center py-2.5 px-1 text-muted">{row.draw}</td>
                              <td className="text-center py-2.5 px-1 text-muted">{row.lost}</td>
                              <td className="text-center py-2.5 px-1 text-muted">{row.goals_for}</td>
                              <td className="text-center py-2.5 px-1 text-muted">{row.goals_against}</td>
                              <td className="text-center py-2.5 px-1 text-white font-medium">
                                {row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}
                              </td>
                              <td className="text-center py-2.5 px-1 text-white font-bold">{row.points}</td>
                              <td className="py-2.5 pl-1">{renderFormDots(row.form)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No standings for this season.</p>
            )}
          </div>
        )}

        {tab === "stats" && (
          <div className="py-12 text-center">
            <p className="text-sm text-muted">Coming soon</p>
          </div>
        )}

        {tab === "squad" && (
          <div className="py-12 text-center">
            <p className="text-sm text-muted">Coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
