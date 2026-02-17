import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MatchStatus } from "@/components/match/match-status";
import { MatchScore } from "@/components/match/match-score";

export interface TeamInfo {
  id: string;
  name: string;
  crest?: string | null;
}

export interface MatchCardProps {
  id: string;
  competition: string;
  home: TeamInfo;
  away: TeamInfo;
  homeScore: number | null;
  awayScore: number | null;
  isLive?: boolean;
  minute?: number | null;
  time?: string;
}

export function MatchCard({
  id,
  competition,
  home,
  away,
  homeScore,
  awayScore,
  isLive = false,
  minute = null,
  time,
}: MatchCardProps) {
  const started = homeScore != null && awayScore != null && !isLive;

  return (
    <Link href={`/matches/${id}`}>
      <article className="bg-surface2 border border-border rounded-card p-3.5 hover:border-border2 transition-colors">
        <div className="flex justify-between mb-2.5">
          <Badge>{competition}</Badge>
          <MatchStatus live={isLive} minute={minute} time={time} />
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {home.crest ? (
              <span className="shrink-0 w-6 h-6 rounded bg-surface3 flex items-center justify-center text-sm" aria-hidden>
                {home.crest}
              </span>
            ) : null}
            <span className="truncate text-sm font-sans text-white">{home.name}</span>
          </div>
          <MatchScore
            home={homeScore}
            away={awayScore}
            scheduled={!started && !isLive}
          />
          <div className="flex items-center gap-2 min-w-0 justify-end">
            <span className="truncate text-sm font-sans text-white text-right">{away.name}</span>
            {away.crest ? (
              <span className="shrink-0 w-6 h-6 rounded bg-surface3 flex items-center justify-center text-sm" aria-hidden>
                {away.crest}
              </span>
            ) : null}
          </div>
        </div>
      </article>
    </Link>
  );
}
