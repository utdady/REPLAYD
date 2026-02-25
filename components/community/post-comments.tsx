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
    <div className="mt-3 pt-3 border-t border-border">
      <p className="text-xs font-mono text-muted mb-2">
        {count} comment{count !== 1 ? "s" : ""}
      </p>
      {loading ? (
        <p className="text-xs text-muted">Loading comments…</p>
      ) : comments && comments.length > 0 ? (
        <ul className="space-y-2 mb-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2">
              <Link href={`/users/${c.username}`} className="shrink-0">
                <span
                  className="block w-7 h-7 rounded-full bg-surface3 bg-cover bg-center"
                  style={{ backgroundImage: c.avatar_url ? `url(${c.avatar_url})` : undefined }}
                  aria-hidden
                />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/users/${c.username}`}
                    className="text-xs font-medium text-white hover:text-green"
                  >
                    {c.username}
                  </Link>
                  <span className="text-[10px] font-mono text-muted2">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5 whitespace-pre-wrap break-words">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, 500))}
            placeholder="Add a comment…"
            maxLength={500}
            className="flex-1 min-w-0 px-3 py-2 rounded-btn bg-surface2 border border-border text-white text-sm placeholder:text-muted focus:outline-none focus:border-border2"
          />
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="px-3 py-2 rounded-btn bg-green text-black text-sm font-semibold disabled:opacity-50"
          >
            {submitting ? "…" : "Post"}
          </button>
        </form>
      ) : (
        <p className="text-xs text-muted">Sign in to comment.</p>
      )}
      {error && <p className="text-xs text-red mt-1">{error}</p>}
    </div>
  );
}
