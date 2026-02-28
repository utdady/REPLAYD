"use client";

import * as React from "react";
import Link from "next/link";
import { getLogComments, createLogComment, type LogCommentRow } from "@/app/actions/community";
import { formatDistanceToNow } from "date-fns";

export interface PostCommentsProps {
  logId: string;
  initialCount: number;
  currentUserId: string | null;
  onCommentAdded?: () => void;
}

export function PostComments({
  logId,
  initialCount,
  currentUserId,
  onCommentAdded,
}: PostCommentsProps) {
  const [comments, setComments] = React.useState<LogCommentRow[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [body, setBody] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadComments = React.useCallback(async () => {
    setLoading(true);
    const list = await getLogComments(logId);
    setComments(list);
    setLoading(false);
  }, [logId]);

  React.useEffect(() => {
    loadComments();
  }, [loadComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUserId || !body.trim()) return;
    setError(null);
    setSubmitting(true);
    const result = await createLogComment(logId, body.trim());
    setSubmitting(false);
    if (result.ok) {
      setBody("");
      const list = await getLogComments(logId);
      setComments(list);
      onCommentAdded?.();
    } else {
      setError(result.error);
    }
  }

  const count = comments?.length ?? initialCount;

  return (
    <div className="relative pl-10">
      {/* Thread line — left of avatars */}
      <div
        className="absolute left-5 top-0 bottom-0 w-px bg-border/60"
        aria-hidden
      />
      <p className="text-[0.8125rem] text-muted py-3">
        {count} comment{count !== 1 ? "s" : ""}
      </p>
      {loading ? (
        <p className="text-[0.8125rem] text-muted pb-3">Loading…</p>
      ) : comments && comments.length > 0 ? (
        <ul className="space-y-4 pb-3">
          {comments.map((c) => (
            <li key={c.id} className="relative flex gap-3">
              <Link href={`/users/${c.username}`} className="shrink-0 mt-0.5">
                <span
                  className="block w-9 h-9 rounded-full bg-surface3 bg-cover bg-center"
                  style={{ backgroundImage: c.avatar_url ? `url(${c.avatar_url})` : undefined }}
                  aria-hidden
                />
              </Link>
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/users/${c.username}`}
                    className="text-[0.8125rem] font-semibold text-white hover:text-green"
                  >
                    {c.username}
                  </Link>
                  <span className="text-[0.75rem] text-muted">
                    @{c.username}
                    <span className="mx-1">·</span>
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-[0.9375rem] text-white mt-0.5 leading-snug whitespace-pre-wrap break-words">
                  {c.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="flex gap-3 py-3">
          <div className="w-9 h-9 rounded-full bg-surface3 shrink-0" aria-hidden />
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <input
              type="text"
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 500))}
              placeholder="Post your reply"
              maxLength={500}
              className="flex-1 min-w-0 px-3 py-2.5 rounded-full bg-surface3 border border-border text-white text-[0.9375rem] placeholder:text-muted focus:outline-none focus:border-border2"
            />
            <button
              type="submit"
              disabled={submitting || !body.trim()}
              className="px-4 py-2.5 rounded-full bg-muted text-white text-[0.8125rem] font-semibold hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "…" : "Reply"}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-[0.8125rem] text-muted py-3">Sign in to reply.</p>
      )}
      {error && <p className="text-[0.8125rem] text-red mt-1 pb-2">{error}</p>}
    </div>
  );
}
