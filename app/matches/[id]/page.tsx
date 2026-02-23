import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { getMatchById, getLogsForMatch, getMatchRatingStats } from "@/app/actions/match";
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

  const [logs, ratingStats] = await Promise.all([
    getLogsForMatch(id, { currentUserId }),
    getMatchRatingStats(id),
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
            <span>Venue TBC</span>
          </div>
          <div className="flex items-center gap-2">
            <span aria-hidden>👤</span>
            <span>Referee TBC</span>
          </div>
        </div>

        {/* Scoreboard */}
        <section className="py-8 border-b border-border">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="text-center min-w-0">
              <p className="font-sans font-medium text-white truncate">{match.home_team_name}</p>
              {match.home_crest_url ? (
                <img src={match.home_crest_url} alt="" className="w-12 h-12 mx-auto mt-2 object-contain" />
              ) : (
                <div className="w-12 h-12 mx-auto mt-2 rounded bg-surface3" />
              )}
            </div>
            <div className="flex flex-col items-center">
              <MatchScore
                home={match.home_score}
                away={match.away_score}
                scheduled={!started && match.status !== "IN_PLAY" && match.status !== "PAUSED"}
                className="text-3xl md:text-4xl text-white"
              />
              <p className="text-xs font-mono text-muted mt-2">{statusLabel(match.status)}</p>
            </div>
            <div className="text-center min-w-0">
              <p className="font-sans font-medium text-white truncate">{match.away_team_name}</p>
              {match.away_crest_url ? (
                <img src={match.away_crest_url} alt="" className="w-12 h-12 mx-auto mt-2 object-contain" />
              ) : (
                <div className="w-12 h-12 mx-auto mt-2 rounded bg-surface3" />
              )}
            </div>
          </div>
        </section>

        {/* Goal scorers */}
        <section className="py-6 border-b border-border">
          <h3 className="text-xs font-mono font-semibold tracking-wider uppercase text-muted mb-3">Goal scorers</h3>
          <p className="text-sm text-muted">Coming soon</p>
        </section>

        {/* Lineups */}
        <section className="py-6 border-b border-border">
          <h3 className="text-xs font-mono font-semibold tracking-wider uppercase text-muted mb-3">Lineups</h3>
          <p className="text-sm text-muted">Coming soon</p>
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
