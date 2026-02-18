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
  /** Season label e.g. "2024/25" */
  season?: string | null;
  /** Match date for display e.g. "Tue 17 Feb" */
  dateLabel?: string | null;
  /** Kick-off time e.g. "15:00" or "20:00" */
  time?: string;
  home: TeamInfo;
  away: TeamInfo;
  homeScore: number | null;
  awayScore: number | null;
  isLive?: boolean;
  minute?: number | null;
}

export function MatchCard({
  id,
  competition,
  season,
  dateLabel,
  time,
  home,
  away,
  homeScore,
  awayScore,
  isLive = false,
  minute = null,
}: MatchCardProps) {
  const started = homeScore != null && awayScore != null && !isLive;

  return (
    <Link href={`/matches/${id}`}>
      <article className="bg-surface2 border border-border rounded-card p-3.5 hover:border-border2 transition-colors">
        <div className="flex justify-between items-start gap-2 mb-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge>{competition}</Badge>
              {season ? (
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted">{season}</span>
              ) : null}
            </div>
            {(dateLabel || time) && (
              <p className="text-[10px] font-mono text-muted2 mt-1">
                {[dateLabel, time].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <MatchStatus live={isLive} minute={minute} time={time} className="shrink-0" />
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {home.crest ? (
              <span className="shrink-0 w-6 h-6 rounded bg-surface3 flex items-center justify-center text-sm overflow-hidden" aria-hidden>
                {home.crest.startsWith("http") ? (
                  <img src={home.crest} alt="" className="w-full h-full object-contain" />
                ) : (
                  home.crest
                )}
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
              <span className="shrink-0 w-6 h-6 rounded bg-surface3 flex items-center justify-center text-sm overflow-hidden" aria-hidden>
                {away.crest.startsWith("http") ? (
                  <img src={away.crest} alt="" className="w-full h-full object-contain" />
                ) : (
                  away.crest
                )}
              </span>
            ) : null}
          </div>
        </div>
      </article>
    </Link>
  );
}
