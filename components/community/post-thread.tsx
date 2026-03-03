"use client";

import * as React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  getLogComments,
  createLogComment,
  createLogReply,
  deleteLogComment,
  type LogCommentRow,
} from "@/app/actions/community";
import { ReviewCharDial } from "@/components/ui/review-char-dial";

export interface PostThreadProps {
  logId: string;
  currentUserId: string | null;
  currentUserAvatarUrl?: string | null;
}

interface ThreadedComment extends LogCommentRow {
  children: ThreadedComment[];
}

function buildThread(comments: LogCommentRow[]): ThreadedComment[] {
  const byId = new Map<string, ThreadedComment>();
  const roots: ThreadedComment[] = [];

  for (const c of comments) {
    byId.set(c.id, { ...c, children: [] });
  }

  byId.forEach((c) => {
    if (c.parent_id && byId.has(c.parent_id)) {
      byId.get(c.parent_id)!.children.push(c);
    } else {
      roots.push(c);
    }
  });

  return roots;
}

export function PostThread({ logId, currentUserId, currentUserAvatarUrl }: PostThreadProps) {
  const [comments, setComments] = React.useState<LogCommentRow[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [rootBody, setRootBody] = React.useState("");
  const [submittingRoot, setSubmittingRoot] = React.useState(false);
  const [replyForId, setReplyForId] = React.useState<string | null>(null);
  const [replyBody, setReplyBody] = React.useState("");
  const [submittingReply, setSubmittingReply] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const replyTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const rootTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  function autoResize(el: HTMLTextAreaElement | null) {
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }

  const loadComments = React.useCallback(async () => {
    setLoading(true);
    try {
      const list = await getLogComments(logId);
      setComments(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load replies.");
    } finally {
      setLoading(false);
    }
  }, [logId]);

  React.useEffect(() => {
    loadComments();
  }, [loadComments]);

  async function handleRootSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUserId || !rootBody.trim()) return;
    setError(null);
    setSubmittingRoot(true);
    const result = await createLogComment(logId, rootBody.trim());
    setSubmittingRoot(false);
    if (result.ok) {
      setRootBody("");
      await loadComments();
    } else {
      setError(result.error);
    }
  }

  async function handleReplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUserId || !replyForId || !replyBody.trim()) return;
    setError(null);
    setSubmittingReply(true);
    const result = await createLogReply(logId, replyForId, replyBody.trim());
    setSubmittingReply(false);
    if (result.ok) {
      setReplyBody("");
      setReplyForId(null);
      await loadComments();
    } else {
      setError(result.error);
    }
  }

  async function handleDelete(commentId: string) {
    if (!currentUserId) return;
    if (typeof window !== "undefined") {
      const confirmed = window.confirm("Delete this comment?");
      if (!confirmed) return;
    }
    setError(null);
    setDeletingId(commentId);
    const result = await deleteLogComment(commentId);
    setDeletingId(null);
    if (result.ok) {
      await loadComments();
    } else {
      setError(result.error);
    }
  }

  const thread = comments ? buildThread(comments) : [];

  function renderComment(c: ThreadedComment, depth = 0) {
    return (
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
          <div className="mt-1 flex items-center gap-4 text-[0.75rem] text-muted">
            {currentUserId && (
              <button
                type="button"
                onClick={() => {
                  setReplyForId(c.id);
                  setReplyBody("");
                  if (replyTextareaRef.current) {
                    replyTextareaRef.current.style.height = "";
                  }
                }}
                className="hover:text-white"
              >
                Reply
              </button>
            )}
            {currentUserId === c.user_id && (
              <button
                type="button"
                onClick={() => handleDelete(c.id)}
                className="hover:text-red/80 disabled:opacity-60"
                disabled={deletingId === c.id}
              >
                {deletingId === c.id ? "Deleting…" : "Delete"}
              </button>
            )}
          </div>
          {replyForId === c.id && currentUserId && (
            <form onSubmit={handleReplySubmit} className="mt-2 flex gap-2">
              <div className="relative flex-1 min-w-0">
                <textarea
                  ref={replyTextareaRef}
                  value={replyBody}
                  onChange={(e) => {
                    const next = e.target.value.slice(0, 180);
                    setReplyBody(next);
                    autoResize(e.target);
                  }}
                  maxLength={180}
                  placeholder="Write a reply"
                  rows={1}
                  className="flex-1 w-full pr-12 px-3 py-2 rounded-2xl bg-surface3 border border-border text-white text-[0.875rem] placeholder:text-muted focus:outline-none focus:border-border2 resize-none leading-snug"
                />
                <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center">
                  <ReviewCharDial value={replyBody.length} max={180} size={32} />
                </div>
              </div>
              <button
                type="submit"
                disabled={submittingReply || !replyBody.trim()}
                className="px-3 py-2 rounded-full bg-muted text-white text-[0.75rem] font-semibold hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submittingReply ? "…" : "Reply"}
              </button>
            </form>
          )}
          {c.children.length > 0 && (
            <ul className="mt-3 space-y-3 border-l border-border/60 pl-5">
              {c.children.map((child) => renderComment(child, depth + 1))}
            </ul>
          )}
        </div>
      </li>
    );
  }

  return (
    <div className="mt-4">
      {currentUserId ? (
        <form onSubmit={handleRootSubmit} className="flex gap-3 py-3 border-b border-border/80">
          {currentUserAvatarUrl ? (
            <span
              className="w-9 h-9 rounded-full bg-surface3 bg-cover bg-center shrink-0 border border-border"
              style={{ backgroundImage: `url(${currentUserAvatarUrl})` }}
              aria-hidden
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-surface3 shrink-0" aria-hidden />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-end gap-2">
              <div className="relative flex-1 min-w-0">
                <textarea
                  ref={rootTextareaRef}
                  value={rootBody}
                  onChange={(e) => {
                    const next = e.target.value.slice(0, 180);
                    setRootBody(next);
                    autoResize(e.target);
                  }}
                  placeholder="Post your reply"
                  maxLength={180}
                  rows={1}
                  className="flex-1 w-full pr-12 px-3 py-2.5 rounded-2xl bg-surface3 border border-border text-white text-[0.9375rem] placeholder:text-muted focus:outline-none focus:border-border2 resize-none leading-snug"
                />
                <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center">
                  <ReviewCharDial value={rootBody.length} max={180} size={32} />
                </div>
              </div>
              <button
                type="submit"
                disabled={submittingRoot || !rootBody.trim()}
                className="px-4 py-2.5 rounded-full bg-muted text-white text-[0.8125rem] font-semibold hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submittingRoot ? "…" : "Reply"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <p className="text-[0.8125rem] text-muted py-3 border-b border-border/80">Sign in to reply.</p>
      )}

      <div className="py-3">
        {loading && <p className="text-[0.8125rem] text-muted pb-3">Loading…</p>}
        {!loading && comments && comments.length === 0 && (
          <p className="text-[0.8125rem] text-muted pb-3">No replies yet.</p>
        )}
        {!loading && comments && comments.length > 0 && (
          <ul className="space-y-4">
            {buildThread(comments).map((c) => renderComment(c))}
          </ul>
        )}
      </div>
      {error && <p className="text-[0.8125rem] text-red mt-1 pb-2">{error}</p>}
    </div>
  );
}

