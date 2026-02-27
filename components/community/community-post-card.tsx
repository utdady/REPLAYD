"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { StarRating } from "@/components/ui/star-rating";
import { toggleLogLike } from "@/app/actions/match";
import { PostComments } from "@/components/community/post-comments";
import type { CommunityFeedItem } from "@/app/actions/community";
import { isDevUsername } from "@/lib/follow-the-goat";

export interface CommunityPostCardProps {
  post: CommunityFeedItem;
  currentUserId: string | null;
  onLikeToggle?: () => void;
}

export function CommunityPostCard({ post, currentUserId, onLikeToggle }: CommunityPostCardProps) {
  const router = useRouter();
  const [liked, setLiked] = React.useState(post.current_user_liked);
  const [likeCount, setLikeCount] = React.useState(post.like_count);
  const [showComments, setShowComments] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const matchLine =
    post.home_score != null && post.away_score != null
      ? `${post.match_title.replace(" v ", ` ${post.home_score}–${post.away_score} `)} · ${post.competition_name}`
      : `${post.match_title} · ${post.competition_name}`;

  async function handleLike() {
    if (!currentUserId) return;
    const result = await toggleLogLike(post.id);
    if (result.ok) {
      setLiked(result.liked);
      setLikeCount((c) => (result.liked ? c + 1 : c - 1));
      onLikeToggle?.();
      router.refresh();
    }
  }

  function handleShare() {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/community?post=${post.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <article className="rounded-card bg-surface2 border border-border overflow-hidden">
      <div className="flex gap-3 p-3">
        <Link href={`/users/${post.username}`} className="shrink-0">
          <span
            className="block w-10 h-10 rounded-full bg-surface3 bg-cover bg-center"
            style={{ backgroundImage: post.avatar_url ? `url(${post.avatar_url})` : undefined }}
            aria-hidden
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/users/${post.username}`}
              className="text-sm font-sans font-medium text-white hover:text-green"
            >
              {post.username}
            </Link>
            {isDevUsername(post.username) && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[.6rem] font-semibold tracking-wider uppercase bg-green/20 text-green border border-green/40">
                DEV
              </span>
            )}
            <span className="text-xs font-mono text-muted2">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
          <Link
            href={`/matches/${post.match_id}`}
            className="text-xs font-mono text-muted2 hover:text-green mt-0.5 block"
          >
            {matchLine}
          </Link>
          {post.rating != null && (
            <div className="mt-1">
              <StarRating value={post.rating} size="sm" readonly />
            </div>
          )}
          {post.review ? (
            <p className="text-sm text-muted mt-1.5 whitespace-pre-wrap break-words">{post.review}</p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-4 px-3 pb-3 pt-0">
        <button
          type="button"
          onClick={handleLike}
          disabled={!currentUserId}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
          aria-label={liked ? "Unlike" : "Like"}
        >
          <span className="text-base" aria-hidden>
            {liked ? "❤️" : "🤍"}
          </span>
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
        <button
          type="button"
          onClick={() => setShowComments((s) => !s)}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-white"
        >
          <span aria-hidden>💬</span>
          {post.comment_count > 0 && <span>{post.comment_count}</span>}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-white"
          aria-label="Copy link"
        >
          <span aria-hidden>🔗</span>
          {copied ? <span className="text-green text-xs">Copied!</span> : null}
        </button>
      </div>
      {showComments && (
        <div className="px-3 pb-3">
          <PostComments
            logId={post.id}
            initialCount={post.comment_count}
            currentUserId={currentUserId}
            onCommentAdded={() => {
              router.refresh();
            }}
          />
        </div>
      )}
    </article>
  );
}
