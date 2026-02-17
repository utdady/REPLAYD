"use client";

import * as React from "react";
import { RatingStars } from "@/components/log/rating-stars";
import { Button } from "@/components/ui/button";

export interface LogFormValues {
  rating: number | null;
  review: string;
  tags: string[];
  spoiler: boolean;
  rewatch: boolean;
}

export interface LogFormProps {
  defaultValues?: Partial<LogFormValues>;
  onSubmit: (values: LogFormValues) => void | Promise<void>;
  isLoading?: boolean;
}

const defaultFormState: LogFormValues = {
  rating: null,
  review: "",
  tags: [],
  spoiler: false,
  rewatch: false,
};

export function LogForm({
  defaultValues,
  onSubmit,
  isLoading = false,
}: LogFormProps) {
  const [rating, setRating] = React.useState<number | null>(defaultValues?.rating ?? null);
  const [review, setReview] = React.useState(defaultValues?.review ?? "");
  const [spoiler, setSpoiler] = React.useState(defaultValues?.spoiler ?? false);
  const [rewatch, setRewatch] = React.useState(defaultValues?.rewatch ?? false);
  const [tags, setTags] = React.useState<string[]>(defaultValues?.tags ?? []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ rating, review, tags, spoiler, rewatch });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-2">
          Rating
        </label>
        <RatingStars value={rating} onChange={setRating} size="lg" />
      </div>
      <div>
        <label htmlFor="log-review" className="block text-xs font-mono uppercase tracking-wider text-muted mb-2">
          Review
        </label>
        <textarea
          id="log-review"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="What did you think?"
          rows={4}
          className="w-full rounded-badge border border-border2 bg-surface px-3 py-2 text-sm font-sans text-white placeholder:text-muted2 focus:outline-none focus:ring-1 focus:ring-green"
        />
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={spoiler}
            onChange={(e) => setSpoiler(e.target.checked)}
            className="rounded border-border bg-surface3 text-green focus:ring-green"
          />
          <span className="text-sm text-muted">Contains spoilers</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rewatch}
            onChange={(e) => setRewatch(e.target.checked)}
            className="rounded border-border bg-surface3 text-green focus:ring-green"
          />
          <span className="text-sm text-muted">Rewatch</span>
        </label>
      </div>
      <Button type="submit" variant="primary" disabled={isLoading}>
        {isLoading ? "Saving…" : "Save log"}
      </Button>
    </form>
  );
}
