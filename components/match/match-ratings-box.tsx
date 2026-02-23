"use client";

import Link from "next/link";
import { StarRating } from "@/components/ui/star-rating";

export interface MatchRatingsBoxProps {
  distribution: Record<number, number>;
  average: number | null;
  totalCount: number;
  matchId: string;
  onLogClick?: () => void;
  showLogCta?: boolean;
  avatarUrl?: string | null;
}

export function MatchRatingsBox({ distribution, average, totalCount, matchId, onLogClick, showLogCta = true, avatarUrl }: MatchRatingsBoxProps) {
  const maxCount = Math.max(1, ...Object.values(distribution));

  return (
    <section className="py-6 border-t border-border">
      <h3 className="text-xs font-mono font-semibold tracking-wider uppercase text-muted mb-4">Ratings</h3>
      {totalCount === 0 ? (
        <p className="text-sm text-muted mb-4">No ratings yet.</p>
      ) : (
        <div className="space-y-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => {
            const count = distribution[star] ?? 0;
            const widthPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted w-4">{star}</span>
                <div className="flex-1 h-3 rounded-sm bg-surface3 overflow-hidden">
                  <div
                    className="h-full rounded-sm bg-green/60 transition-all"
                    style={{ width: `${Math.max(2, widthPct)}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-muted w-4">{count}</span>
              </div>
            );
          })}
        </div>
      )}
      {average != null && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg font-mono text-muted">{average.toFixed(1)}</span>
          <StarRating value={average} size="sm" readonly />
        </div>
      )}
      {showLogCta && (onLogClick ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onLogClick();
          }}
          className="flex w-full items-center gap-3 p-3 rounded-card bg-green border border-green hover:bg-green/90 transition-colors text-left text-black"
        >
          <span
            className="w-10 h-10 rounded-full bg-black/20 shrink-0 bg-cover bg-center ring-2 ring-black/10"
            style={{ backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined }}
            aria-hidden
          />
          <span className="text-sm font-semibold flex-1 text-black">Rate, log, review, add to list + more</span>
          <span className="text-black/70" aria-hidden>⋯</span>
        </button>
      ) : (
        <Link
          href={`/matches/${matchId}/log`}
          className="flex w-full items-center gap-3 p-3 rounded-card bg-green border border-green hover:bg-green/90 transition-colors text-left text-black"
        >
          <span
            className="w-10 h-10 rounded-full bg-black/20 shrink-0 bg-cover bg-center ring-2 ring-black/10"
            style={{ backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined }}
            aria-hidden
          />
          <span className="text-sm font-semibold flex-1 text-black">Rate, log, review, add to list + more</span>
          <span className="text-black/70" aria-hidden>⋯</span>
        </Link>
      ))}
    </section>
  );
}
