"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  getTeamOverview,
  getTeamMatches,
  getTeamTableRows,
  toggleFavoriteTeam,
  type TeamRow,
  type TeamOverviewResult,
  type TeamMatchRow,
  type TeamTableRow,
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
  const [tableRows, setTableRows] = React.useState<TeamTableRow[] | null>(null);
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
      getTeamTableRows(teamId, season)
        .then(setTableRows)
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
                      className="block p-4 rounded-card bg-surface2 border border-border hover:border-border2 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-sm text-muted">
                          {format(new Date(overview.nextMatch.utc_date), "EEE, MMM d")}
                        </span>
                        <Badge>{CODE_TO_LABEL[overview.nextMatch.competition_code] ?? overview.nextMatch.competition_name}</Badge>
                      </div>
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <span className="text-sm text-white truncate text-center">{overview.nextMatch.home_team_name}</span>
                        <span className="text-sm text-muted">
                          {overview.nextMatch.status === "FINISHED"
                            ? `${overview.nextMatch.home_score}–${overview.nextMatch.away_score}`
                            : format(new Date(overview.nextMatch.utc_date), "HH:mm")}
                        </span>
                        <span className="text-sm text-white truncate text-center">{overview.nextMatch.away_team_name}</span>
                      </div>
                    </Link>
                  </section>
                )}
                {overview.form.length > 0 && (
                  <section>
                    <h2 className="text-xs font-mono font-semibold tracking-wider uppercase text-muted mb-2">Team form</h2>
                    <div className="flex gap-2">
                      {overview.form.map((f, i) => (
                        <span
                          key={f.match_id}
                          className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                            f.result === "W" ? "bg-green/20 text-green" : f.result === "D" ? "bg-yellow-500/20 text-yellow-500" : "bg-red-500/20 text-red-400"
                          }`}
                          title={format(new Date(f.utc_date), "EEE d MMM")}
                        >
                          {f.result}
                        </span>
                      ))}
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
                return (
              <div className="space-y-3">
                {matches.map((m, i) => (
                    <div key={m.id} ref={i === currentIndex ? currentMatchRef : undefined}>
                      <Link href={`/matches/${m.id}`}>
                        <article className="bg-surface2 border border-border rounded-card p-3.5 hover:border-border2 transition-colors">
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <span className="text-xs font-mono text-muted">
                              {format(new Date(m.utc_date), "EEE, MMM d")}
                              {new Date(m.utc_date) >= new Date() && ` · ${format(new Date(m.utc_date), "HH:mm")}`}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge>{CODE_TO_LABEL[m.competition_code] ?? m.competition_name}</Badge>
                              {m.watched && (
                                <span className="text-[10px] font-mono text-green uppercase">Watched</span>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {m.home_team_id === teamId ? (
                                <>
                                  {m.home_crest_url ? <img src={m.home_crest_url} alt="" className="w-6 h-6 object-contain shrink-0" /> : <div className="w-6 h-6 rounded bg-surface3 shrink-0" />}
                                  <span className="text-sm text-white truncate">{m.home_team_name}</span>
                                </>
                              ) : (
                                <>
                                  {m.away_crest_url ? <img src={m.away_crest_url} alt="" className="w-6 h-6 object-contain shrink-0" /> : <div className="w-6 h-6 rounded bg-surface3 shrink-0" />}
                                  <span className="text-sm text-white truncate">{m.opponent_name}</span>
                                </>
                              )}
                            </div>
                            <MatchScore
                              home={m.home_score}
                              away={m.away_score}
                              scheduled={m.status !== "FINISHED" && m.status !== "IN_PLAY" && m.status !== "PAUSED"}
                            />
                            <div className="flex items-center gap-2 min-w-0 justify-end">
                              {m.away_team_id === teamId ? (
                                <>
                                  <span className="text-sm text-white truncate text-right">{m.away_team_name}</span>
                                  {m.away_crest_url ? <img src={m.away_crest_url} alt="" className="w-6 h-6 object-contain shrink-0" /> : <div className="w-6 h-6 rounded bg-surface3 shrink-0" />}
                                </>
                              ) : (
                                <>
                                  <span className="text-sm text-white truncate text-right">{m.opponent_name}</span>
                                  {m.opponent_crest_url ? <img src={m.opponent_crest_url} alt="" className="w-6 h-6 object-contain shrink-0" /> : <div className="w-6 h-6 rounded bg-surface3 shrink-0" />}
                                </>
                              )}
                            </div>
                          </div>
                        </article>
                      </Link>
                    </div>
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
            ) : tableRows && tableRows.length > 0 ? (
              <div className="space-y-6">
                {tableRows.map((row) => (
                  <section key={row.competition_id}>
                    <h2 className="text-sm font-mono font-semibold text-muted mb-2">{row.competition_name}</h2>
                    <div className={`rounded-card border p-3 ${row.is_highlight ? "border-green bg-green/5" : "border-border bg-surface2"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-muted font-mono w-6">{row.position}</span>
                          {row.crest_url ? <img src={row.crest_url} alt="" className="w-6 h-6 object-contain" /> : <div className="w-6 h-6 rounded bg-surface3" />}
                          <span className="text-white font-medium">{row.team_name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted">Pts {row.points}</span>
                          <span className="text-white">GD {row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mt-2 text-xs text-muted font-mono">
                        <span>P {row.played_games}</span>
                        <span>W {row.won}</span>
                        <span>D {row.draw}</span>
                        <span>L {row.lost}</span>
                      </div>
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
