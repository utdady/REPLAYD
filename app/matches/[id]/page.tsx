import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { getMatchById, getMatchGoals, getMatchLineups, getLogsForMatch, getMatchRatingStats } from "@/app/actions/match";
import { getMyProfile } from "@/app/actions/profile";
import { MatchScore } from "@/components/match/match-score";
import { MatchLogSheet } from "@/components/match/match-log-sheet";
import { CommunityLogsSection } from "@/components/match/community-logs-section";

function statusLabel(status: string): string {
  switch (status) {
    case "FINISHED":
      return "Full time";
    case "IN_PLAY":
    case "PAUSED":
      return "Live";
    case "SCHEDULED":
    case "TIMED":
      return "Scheduled";
    case "POSTPONED":
      return "Postponed";
    case "SUSPENDED":
      return "Suspended";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await getMatchById(id);
  if (!match) notFound();

  const currentUser = await getMyProfile();
  const currentUserAvatarUrl = currentUser?.avatar_url ?? null;
  const currentUserId = currentUser?.id ?? null;

  const [logs, ratingStats, goals, lineups] = await Promise.all([
    getLogsForMatch(id, { currentUserId }),
    getMatchRatingStats(id),
    getMatchGoals(id),
    getMatchLineups(id),
  ]);

  const matchTitle = `${match.home_team_name} vs ${match.away_team_name}`;
  const matchDate = new Date(match.utc_date);
  const started = match.home_score != null && match.away_score != null && match.status === "FINISHED";
  const matchFinished = match.status === "FINISHED";

  return (
    <div className="pt-20 md:pt-24 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pb-24">
        {/* Top bar: back, competition name */}
        <header className="flex items-center justify-between gap-4 py-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2 text-sm font-mono text-muted hover:text-white shrink-0">
            <span aria-hidden>←</span>
            Matches
          </Link>
          <div className="flex items-center justify-center gap-2 min-w-0">
            {match.emblem_url ? (
              <img src={match.emblem_url} alt="" className="w-6 h-6 object-contain shrink-0" />
            ) : null}
            <span className="text-sm font-mono text-white truncate">
              {match.competition_name}
            </span>
          </div>
          <div className="w-16 shrink-0" />
        </header>

        {/* Match info row */}
        <div className="py-4 space-y-2 text-sm font-mono text-muted">
          <div className="flex items-center gap-2">
            <span aria-hidden>📅</span>
            <span>{format(matchDate, "EEE, MMMM d, h:mm a")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span aria-hidden>🏟</span>
            <span>{match.venue ?? "Venue TBC"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span aria-hidden>👤</span>
            <span>{match.referee_name ?? "Referee TBC"}</span>
          </div>
        </div>

        {/* Scoreboard */}
        <section className="py-8 border-b border-border">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <Link href={`/teams/${match.home_team_id}`} className="text-center min-w-0 hover:opacity-90 transition-opacity">
              <p className="font-sans font-medium text-white truncate">{match.home_team_name}</p>
              {match.home_crest_url ? (
                <img src={match.home_crest_url} alt="" className="w-12 h-12 mx-auto mt-2 object-contain" />
              ) : (
                <div className="w-12 h-12 mx-auto mt-2 rounded bg-surface3" />
              )}
            </Link>
            <div className="flex flex-col items-center">
              <MatchScore
                home={match.home_score}
                away={match.away_score}
                scheduled={!started && match.status !== "IN_PLAY" && match.status !== "PAUSED"}
                className="text-3xl md:text-4xl text-white"
              />
              <p className="text-xs font-mono text-muted mt-2">{statusLabel(match.status)}</p>
            </div>
            <Link href={`/teams/${match.away_team_id}`} className="text-center min-w-0 hover:opacity-90 transition-opacity">
              <p className="font-sans font-medium text-white truncate">{match.away_team_name}</p>
              {match.away_crest_url ? (
                <img src={match.away_crest_url} alt="" className="w-12 h-12 mx-auto mt-2 object-contain" />
              ) : (
                <div className="w-12 h-12 mx-auto mt-2 rounded bg-surface3" />
              )}
            </Link>
          </div>
        </section>

        {/* Goal scorers */}
        <section className="py-6 border-b border-border">
          <h3 className="text-xs font-mono font-semibold tracking-wider uppercase text-muted mb-3">Goal scorers</h3>
          {goals.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {goals.map((g, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-2 text-white">
                  <span className="font-mono text-muted tabular-nums">{g.minute ?? "?"}{g.injury_time != null ? `+${g.injury_time}` : ""}&apos;</span>
                  <span>{g.scorer_name}</span>
                  {g.type === "PENALTY" ? (
                    <span className="text-xs text-muted">(pen)</span>
                  ) : null}
                  {g.assist_name ? (
                    <span className="text-muted">assist: {g.assist_name}</span>
                  ) : null}
                  <span className="text-muted">— {g.score_home}-{g.score_away}</span>
                </li>
              ))}
            </ul>
          ) : matchFinished ? (
            <p className="text-sm text-muted">No goal data yet</p>
          ) : (
            <p className="text-sm text-muted">Coming soon</p>
          )}
        </section>

        {/* Lineups */}
        <section className="py-6 border-b border-border">
          <h3 className="text-xs font-mono font-semibold tracking-wider uppercase text-muted mb-3">Lineups</h3>
          {lineups.home ?? lineups.away ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {lineups.home ? (
                <div>
                  <p className="text-xs font-mono text-muted mb-1">{match.home_team_name}</p>
                  {lineups.home.formation ? (
                    <p className="text-sm text-muted mb-2">{lineups.home.formation}</p>
                  ) : null}
                  {lineups.home.coach_name ? (
                    <p className="text-sm text-muted mb-3">Coach: {lineups.home.coach_name}</p>
                  ) : null}
                  <ul className="space-y-1 text-sm text-white">
                    {lineups.home.lineup.map((p, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="font-mono text-muted w-6">{p.shirtNumber ?? "—"}</span>
                        <span>{p.name}</span>
                        {p.position ? <span className="text-muted truncate">{p.position}</span> : null}
                      </li>
                    ))}
                  </ul>
                  {lineups.home.bench.length > 0 ? (
                    <>
                      <p className="text-xs font-mono text-muted mt-3 mb-1">Bench</p>
                      <ul className="space-y-1 text-sm text-muted">
                        {lineups.home.bench.map((p, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="font-mono w-6">{p.shirtNumber ?? "—"}</span>
                            <span>{p.name}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>
              ) : null}
              {lineups.away ? (
                <div>
                  <p className="text-xs font-mono text-muted mb-1">{match.away_team_name}</p>
                  {lineups.away.formation ? (
                    <p className="text-sm text-muted mb-2">{lineups.away.formation}</p>
                  ) : null}
                  {lineups.away.coach_name ? (
                    <p className="text-sm text-muted mb-3">Coach: {lineups.away.coach_name}</p>
                  ) : null}
                  <ul className="space-y-1 text-sm text-white">
                    {lineups.away.lineup.map((p, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="font-mono text-muted w-6">{p.shirtNumber ?? "—"}</span>
                        <span>{p.name}</span>
                        {p.position ? <span className="text-muted truncate">{p.position}</span> : null}
                      </li>
                    ))}
                  </ul>
                  {lineups.away.bench.length > 0 ? (
                    <>
                      <p className="text-xs font-mono text-muted mt-3 mb-1">Bench</p>
                      <ul className="space-y-1 text-sm text-muted">
                        {lineups.away.bench.map((p, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="font-mono w-6">{p.shirtNumber ?? "—"}</span>
                            <span>{p.name}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted">Lineups not available</p>
          )}
        </section>

        {/* Watch / highlights */}
        <section className="py-6 border-b border-border">
          <Link
            href="#"
            className="inline-flex items-center gap-2 text-sm font-mono text-green hover:underline"
          >
            Watch game highlights
          </Link>
        </section>

        {/* Ratings box + community logs + sticky CTA (sheet opens from CTA and ratings) */}
        <MatchLogSheet
          matchId={match.id}
          matchIdStr={id}
          matchTitle={matchTitle}
          distribution={ratingStats.distribution}
          average={ratingStats.average}
          totalCount={ratingStats.totalCount}
          matchFinished={matchFinished}
          currentUserAvatarUrl={currentUserAvatarUrl}
        >
          <CommunityLogsSection
            initialLogs={logs}
            matchId={id}
            matchTitle={matchTitle}
            currentUserId={currentUserId}
          />
        </MatchLogSheet>
      </div>
    </div>
  );
}
