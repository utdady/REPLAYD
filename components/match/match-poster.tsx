import Link from "next/link";
import { MatchScore } from "@/components/match/match-score";

export interface MatchPosterTeam {
  name: string;
  crest?: string | null;
}

export interface MatchPosterProps {
  id: string;
  competition: string;
  home: MatchPosterTeam;
  away: MatchPosterTeam;
  homeScore: number | null;
  awayScore: number | null;
  /** Optional friend avatar URL and username for "New from friends" row */
  friend?: { avatarUrl?: string | null; username: string } | null;
}

export function MatchPoster({
  id,
  competition,
  home,
  away,
  homeScore,
  awayScore,
  friend = null,
}: MatchPosterProps) {
  const started = homeScore != null && awayScore != null;

  return (
    <Link href={`/matches/${id}`} className="shrink-0 w-[90px] md:w-[120px] group">
      <div className="rounded-md bg-surface3 aspect-[3/4] flex flex-col items-center justify-center gap-1 p-2 relative overflow-hidden group-hover:ring-1 group-hover:ring-border2 transition-all">
        <div className="flex items-center gap-1 text-xs text-muted">
          <span aria-hidden>{home.crest ?? "•"}</span>
          <span aria-hidden>{away.crest ?? "•"}</span>
        </div>
        <MatchScore home={homeScore} away={awayScore} scheduled={!started} />
        <span className="absolute bottom-1 left-1 text-[10px] font-mono text-green">
          {competition}
        </span>
      </div>
      <p className="mt-1.5 text-[10px] font-sans text-muted truncate">
        {home.name} · {away.name}
      </p>
      {friend ? (
        <div className="mt-1 flex items-center gap-1.5">
          <span
            className="w-4 h-4 rounded-full bg-green-dim flex shrink-0"
            style={{ backgroundImage: friend.avatarUrl ? `url(${friend.avatarUrl})` : undefined, backgroundSize: "cover" }}
            aria-hidden
          />
          <span className="text-[10px] font-sans text-muted truncate">{friend.username}</span>
        </div>
      ) : null}
    </Link>
  );
}
