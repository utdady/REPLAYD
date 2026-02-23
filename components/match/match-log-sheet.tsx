"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createMatchLog } from "@/app/actions/match";
import {
  getListsForCurrentUser,
  createList,
  addMatchToList,
} from "@/app/actions/list";
import type { ListSummary } from "@/app/actions/list";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { StarRating } from "@/components/ui/star-rating";
import { ReviewCharDial } from "@/components/ui/review-char-dial";
import { Button } from "@/components/ui/button";
import { MatchRatingsBox } from "@/components/match/match-ratings-box";

export interface MatchLogSheetProps {
  matchId: number;
  matchIdStr: string;
  matchTitle: string;
  distribution: Record<number, number>;
  average: number | null;
  totalCount: number;
  matchFinished: boolean;
  currentUserAvatarUrl?: string | null;
  children: React.ReactNode;
}

export function MatchLogSheet({
  matchId,
  matchIdStr,
  matchTitle,
  distribution,
  average,
  totalCount,
  matchFinished,
  currentUserAvatarUrl,
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

  const [lists, setLists] = React.useState<ListSummary[]>([]);
  const [listsLoading, setListsLoading] = React.useState(false);
  const [selectedListId, setSelectedListId] = React.useState<string>("");
  const [addToListError, setAddToListError] = React.useState<string | null>(null);
  const [addToListSuccess, setAddToListSuccess] = React.useState(false);
  const [showCreateList, setShowCreateList] = React.useState(false);
  const [newListTitle, setNewListTitle] = React.useState("");
  const [newListDescription, setNewListDescription] = React.useState("");
  const [creatingList, setCreatingList] = React.useState(false);
  const [sheetView, setSheetView] = React.useState<"quick" | "detail">("quick");
  const [savingQuick, setSavingQuick] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setListsLoading(true);
      getListsForCurrentUser()
        .then(setLists)
        .finally(() => setListsLoading(false));
      setAddToListError(null);
      setAddToListSuccess(false);
    }
  }, [open]);

  const handleAddToList = async () => {
    if (!selectedListId) return;
    setAddToListError(null);
    const result = await addMatchToList(selectedListId, matchId);
    if (result.ok) {
      setAddToListSuccess(true);
      router.refresh();
    } else {
      setAddToListError(result.error);
    }
  };

  const handleCreateListAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newListTitle.trim();
    if (!title) return;
    setCreatingList(true);
    setAddToListError(null);
    const created = await createList(title, newListDescription.trim() || undefined);
    if (!created.ok) {
      setAddToListError(created.error);
      setCreatingList(false);
      return;
    }
    const added = await addMatchToList(created.listId, matchId);
    setCreatingList(false);
    if (added.ok) {
      setShowCreateList(false);
      setNewListTitle("");
      setNewListDescription("");
      setLists((prev) => [...prev, { id: created.listId, title, description: newListDescription.trim() || null, is_ranked: false, item_count: 1 }]);
      setAddToListSuccess(true);
      router.refresh();
    } else {
      setAddToListError(added.error);
    }
  };

  const openSheet = React.useCallback(() => setOpen(true), []);
  const closeSheet = React.useCallback(() => {
    setOpen(false);
    setError(null);
    setSheetView("quick");
  }, []);

  React.useEffect(() => {
    if (open) setSheetView("quick");
  }, [open]);

  async function handleQuickDone() {
    if (rating != null) {
      setSavingQuick(true);
      await createMatchLog(matchId, { rating });
      setSavingQuick(false);
    }
    closeSheet();
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await createMatchLog(matchId, {
      rating: rating ?? undefined,
      review: review.trim().slice(0, 180) || undefined,
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
        onLogClick={matchFinished ? openSheet : undefined}
        showLogCta={matchFinished}
        avatarUrl={currentUserAvatarUrl}
      />
      {children}
      <BottomSheet open={open} onClose={closeSheet} title={matchTitle}>
        {sheetView === "quick" ? (
          <div className="space-y-5 pb-6">
            <div>
              <label className="block text-sm font-medium text-muted mb-2">Rate</label>
              <StarRating value={rating} onChange={setRating} size="lg" />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setSheetView("detail")}
              >
                Review or log
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setSheetView("detail")}
              >
                Add to lists
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => {}}>
                Share
              </Button>
            </div>
            <Button
              type="button"
              variant="primary"
              className="w-full py-3"
              onClick={handleQuickDone}
              disabled={savingQuick}
            >
              {savingQuick ? "Saving…" : "Done"}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pb-6">
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setSheetView("quick")}
                className="text-muted hover:text-white p-1 -ml-1"
                aria-label="Back"
              >
                ← Back
              </button>
            </div>
            <div>
            <label className="block text-sm font-medium text-muted mb-2">Rating (optional)</label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>
          <div>
            <label htmlFor="sheet-review" className="block text-sm font-medium text-muted mb-2">
              Review (optional, max 180 characters)
            </label>
            <div className="relative">
              <textarea
                id="sheet-review"
                value={review}
                onChange={(e) => setReview(e.target.value.slice(0, 180))}
                maxLength={180}
                rows={3}
                className="w-full px-3 py-2 pr-14 pb-12 rounded-btn bg-surface2 border border-border text-white placeholder:text-muted focus:outline-none focus:border-border2"
                placeholder="What did you think?"
              />
              <div className="absolute bottom-2 right-2">
                <ReviewCharDial value={review.length} max={180} size={44} showCountdown />
              </div>
            </div>
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

          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-medium text-muted mb-2">Add to list</h4>
            {listsLoading ? (
              <p className="text-xs text-muted">Loading lists…</p>
            ) : showCreateList ? (
              <form onSubmit={handleCreateListAndAdd} className="space-y-2">
                <input
                  type="text"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  placeholder="List name"
                  className="w-full px-3 py-2 rounded-btn bg-surface2 border border-border text-white placeholder:text-muted focus:outline-none focus:border-border2 text-sm"
                />
                <input
                  type="text"
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full px-3 py-2 rounded-btn bg-surface2 border border-border text-white placeholder:text-muted focus:outline-none focus:border-border2 text-sm"
                />
                <div className="flex gap-2">
                  <Button type="submit" variant="primary" disabled={creatingList || !newListTitle.trim()}>
                    {creatingList ? "Creating…" : "Create and add"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowCreateList(false)}
                    className="px-3 py-1.5 text-sm text-muted hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : lists.length === 0 ? (
              <button
                type="button"
                onClick={() => setShowCreateList(true)}
                className="text-sm text-green hover:underline"
              >
                Create a list and add this match
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 rounded-btn bg-surface2 border border-border text-white text-sm focus:outline-none focus:border-border2"
                >
                  <option value="">Choose a list</option>
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.title}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleAddToList}
                  disabled={!selectedListId}
                >
                  Add
                </Button>
                <button
                  type="button"
                  onClick={() => setShowCreateList(true)}
                  className="text-xs text-muted hover:text-white"
                >
                  + New list
                </button>
              </div>
            )}
            {addToListError && <p className="text-xs text-red mt-1">{addToListError}</p>}
            {addToListSuccess && <p className="text-xs text-green mt-1">Added to list.</p>}
          </div>

          {error && <p className="text-sm text-red">{error}</p>}
          <Button type="submit" variant="primary" className="w-full py-3" disabled={submitting}>
            {submitting ? "Saving…" : "Done"}
          </Button>
        </form>
        )}
      </BottomSheet>
    </>
  );
}
