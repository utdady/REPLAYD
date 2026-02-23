"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createMatchLog } from "@/app/actions/match";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { RatingDial } from "@/components/ui/rating-dial";
import { Button } from "@/components/ui/button";
import { MatchRatingsBox } from "@/components/match/match-ratings-box";

export interface MatchLogSheetProps {
  matchId: number;
  matchIdStr: string;
  matchTitle: string;
  distribution: Record<number, number>;
  average: number | null;
  totalCount: number;
  children: React.ReactNode;
}

export function MatchLogSheet({
  matchId,
  matchIdStr,
  matchTitle,
  distribution,
  average,
  totalCount,
  children,
}: MatchLogSheetProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState<number | null>(null);
  const [review, setReview] = React.useState("");
  const [watchedDate, setWatchedDate] = React.useState("");
  const [isRewatch, setIsRewatch] = React.useState(false);
  const [containsSpoilers, setContainsSpoilers] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const openSheet = React.useCallback(() => setOpen(true), []);
  const closeSheet = React.useCallback(() => {
    setOpen(false);
    setError(null);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await createMatchLog(matchId, {
      rating: rating ?? undefined,
      review: review.trim().slice(0, 280) || undefined,
      watched_date: watchedDate || undefined,
      is_rewatch: isRewatch,
      contains_spoilers: containsSpoilers,
    });
    setSubmitting(false);
    if (result.ok) {
      closeSheet();
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <>
      <MatchRatingsBox
        distribution={distribution}
        average={average}
        totalCount={totalCount}
        matchId={matchIdStr}
        onLogClick={openSheet}
      />
      {children}
      <div className="fixed bottom-20 md:bottom-6 left-0 right-0 max-w-2xl mx-auto px-4 z-40">
        <Button variant="primary" className="w-full py-3" onClick={openSheet}>
          Log this game
        </Button>
      </div>
      <BottomSheet open={open} onClose={closeSheet} title={matchTitle}>
        <form onSubmit={handleSubmit} className="space-y-5 pb-6">
          <div>
            <label className="block text-sm font-medium text-muted mb-2">Rating (optional)</label>
            <RatingDial value={rating} onChange={setRating} size={100} />
          </div>
          <div>
            <label htmlFor="sheet-review" className="block text-sm font-medium text-muted mb-2">
              Review (optional, max 280 characters)
            </label>
            <textarea
              id="sheet-review"
              value={review}
              onChange={(e) => setReview(e.target.value.slice(0, 280))}
              maxLength={280}
              rows={3}
              className="w-full px-3 py-2 rounded-btn bg-surface2 border border-border text-white placeholder:text-muted focus:outline-none focus:border-border2"
              placeholder="What did you think?"
            />
            <p className="text-xs font-mono text-muted mt-1 text-right">{review.length}/280</p>
          </div>
          <div>
            <label htmlFor="sheet-watched_date" className="block text-sm font-medium text-muted mb-2">
              Watched on (optional)
            </label>
            <input
              id="sheet-watched_date"
              type="date"
              value={watchedDate}
              onChange={(e) => setWatchedDate(e.target.value)}
              className="w-full px-3 py-2 rounded-btn bg-surface2 border border-border text-white focus:outline-none focus:border-border2"
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRewatch}
                onChange={(e) => setIsRewatch(e.target.checked)}
                className="rounded border-border bg-surface2 text-green focus:ring-green"
              />
              <span className="text-sm text-muted">Rewatch</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={containsSpoilers}
                onChange={(e) => setContainsSpoilers(e.target.checked)}
                className="rounded border-border bg-surface2 text-green focus:ring-green"
              />
              <span className="text-sm text-muted">Review contains spoilers</span>
            </label>
          </div>
          {error && <p className="text-sm text-red">{error}</p>}
          <Button type="submit" variant="primary" className="w-full py-3" disabled={submitting}>
            {submitting ? "Saving…" : "Done"}
          </Button>
        </form>
      </BottomSheet>
    </>
  );
}
