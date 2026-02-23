"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMatchLog } from "@/app/actions/match";
import { StarRating } from "@/components/ui/star-rating";
import { ReviewCharDial } from "@/components/ui/review-char-dial";
import { Button } from "@/components/ui/button";

export function LogMatchForm({ matchId, matchIdStr }: { matchId: number; matchIdStr: string }) {
  const router = useRouter();
  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState("");
  const [watchedDate, setWatchedDate] = useState("");
  const [isRewatch, setIsRewatch] = useState(false);
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await createMatchLog(matchId, {
      rating: rating ?? undefined,
      review: review.trim() || undefined,
      watched_date: watchedDate || undefined,
      is_rewatch: isRewatch,
      contains_spoilers: containsSpoilers,
    });
    setSubmitting(false);
    if (result.ok) {
      router.push(`/matches/${matchIdStr}`);
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-muted mb-2">Rating (optional)</label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>
      <div>
        <label htmlFor="review" className="block text-sm font-medium text-muted mb-2">
          Review (optional, max 280 characters)
        </label>
        <div className="flex items-start gap-3">
          <textarea
            id="review"
            value={review}
            onChange={(e) => setReview(e.target.value.slice(0, 280))}
            maxLength={280}
            rows={4}
            className="flex-1 min-w-0 px-3 py-2 rounded-btn bg-surface2 border border-border text-white placeholder:text-muted focus:outline-none focus:border-border2"
            placeholder="What did you think?"
          />
          <ReviewCharDial value={review.length} size={44} className="shrink-0 mt-1" />
        </div>
        <p className="text-xs font-mono text-muted mt-1 text-right">{review.length}/280</p>
      </div>
      <div>
        <label htmlFor="watched_date" className="block text-sm font-medium text-muted mb-2">
          Watched on (optional)
        </label>
        <input
          id="watched_date"
          type="date"
          value={watchedDate}
          onChange={(e) => setWatchedDate(e.target.value)}
          className="w-full px-3 py-2 rounded-btn bg-surface2 border border-border text-white focus:outline-none focus:border-border2"
        />
      </div>
      <div className="space-y-3">
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
        {submitting ? "Saving…" : "Save log"}
      </Button>
    </form>
  );
}
