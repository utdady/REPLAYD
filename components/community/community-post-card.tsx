"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toggleLogLike } from "@/app/actions/match";
import type { CommunityFeedItem } from "@/app/actions/community";
import { isDevUsername } from "@/lib/follow-the-goat";
import { ReplaydStars } from "@/components/ui/replayd-stars";

/** Horizontal padding for post body and action row — keeps avatar, content, and comment icon on same left alignment */
const POST_PADDING_X = "px-4";

/** Competition code → short label for match header (saves space vs full name) */
const COMPETITION_ABBREV: Record<string, string> = {
  PL: "EPL",
  CL: "UCL",
  PD: "La Liga",
  BL1: "BL",
  SA: "Serie A",
  FL1: "L1",
};

// Icons inherit color from parent via currentColor
function CommentIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 19.5 4 21v-3.5" />
      <path d="M5.5 5h13A1.5 1.5 0 0 1 20 6.5v7A1.5 1.5 0 0 1 18.5 15h-9L7 17l-1.5-2H5.5A1.5 1.5 0 0 1 4 13.5v-7A1.5 1.5 0 0 1 5.5 5Z" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20s-4.5-2.7-7.1-5.3C2.4 12.2 2 9.7 3.3 8a3.8 3.8 0 0 1 5.7-.2L12 10l3-2.2a3.8 3.8 0 0 1 5.7.2c1.3 1.7.9 4.2-1.6 6.7C16.5 17.3 12 20 12 20Z" />
    </svg>
  );
}

function HeartFilledIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="currentColor"
    >
      <path d="M12 20s-4.5-2.7-7.1-5.3C2.4 12.2 2 9.7 3.3 8a3.8 3.8 0 0 1 5.7-.2L12 10l3-2.2a3.8 3.8 0 0 1 5.7.2c1.3 1.7.9 4.2-1.6 6.7C16.5 17.3 12 20 12 20Z" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.5 14.5 8 16a3 3 0 0 0 4.2 4.2l2.8-2.8A3 3 0 0 0 15.5 12" />
      <path d="M14.5 9.5 16 8a3 3 0 0 0-4.2-4.2L9 6.6A3 3 0 0 0 8.5 12" />
      <path d="M9 12h6" />
    </svg>
  );
}

export interface CommunityPostCardProps {
  post: CommunityFeedItem;
  currentUserId: string | null;
  onLikeToggle?: () => void;
}

export function CommunityPostCard({ post, currentUserId, onLikeToggle }: CommunityPostCardProps) {
  const router = useRouter();
  const [liked, setLiked] = React.useState(post.current_user_liked);
  const [likeCount, setLikeCount] = React.useState(post.like_count);
  const [copied, setCopied] = React.useState(false);
  const [justLiked, setJustLiked] = React.useState(false);

  const competitionLabel = COMPETITION_ABBREV[post.competition_code] ?? post.competition_name;
  const baseMatchLine =
    post.home_score != null && post.away_score != null
      ? `${post.match_title.replace(" v ", ` ${post.home_score}–${post.away_score} `)} · ${competitionLabel}`
      : `${post.match_title} · ${competitionLabel}`;

  const matchLine =
    post.season_year != null ? `${baseMatchLine} · ${post.season_year}` : baseMatchLine;

  async function handleLike() {
    if (!currentUserId) return;
    const result = await toggleLogLike(post.id);
    if (result.ok) {
      setLiked(result.liked);
      setLikeCount((c) => (result.liked ? c + 1 : c - 1));
       if (result.liked) {
         setJustLiked(true);
         setTimeout(() => setJustLiked(false), 180);
       }
      onLikeToggle?.();
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
    <article
      className="rounded-card bg-surface2 border border-border overflow-hidden cursor-pointer"
      onClick={() => {
        router.push(`/community/${post.id}`);
      }}
    >
      {/* Green match header bar */}
      <div className="relative bg-green text-black overflow-hidden" style={{ height: "2rem" }}>
        <div className="absolute inset-0 flex items-start justify-between px-4" style={{ paddingTop: "0.35rem" }}>
          <Link
            href={`/matches/${post.match_id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 truncate text-[0.9375rem] font-semibold text-black hover:opacity-80"
          >
            {matchLine}
          </Link>
          {post.rating != null && (
            <div className="flex shrink-0 ml-4" style={{ marginTop: "0.38rem", transform: "scale(1.3)", transformOrigin: "center right" }}>
              <ReplaydStars value={post.rating} size="sm" />
            </div>
          )}
        </div>
      </div>

      {/* Post body - X/Twitter style: compact spacing, avatar + inline username */}
      <div className={`pt-3 pb-2 ${POST_PADDING_X}`}>
        <div className="flex items-start gap-2.5">
          {/* Avatar */}
          <Link href={`/users/${post.username}`} className="shrink-0" aria-label={`${post.username} profile`}>
            <span
              className="block w-10 h-10 rounded-full bg-surface3 bg-cover bg-center border border-border"
              style={{ backgroundImage: post.avatar_url ? `url(${post.avatar_url})` : undefined }}
              aria-hidden
            />
          </Link>
          
          {/* Username line + review */}
          <div className="min-w-0 flex-1">
            {/* Username header - display name + handle + timestamp on ONE line */}
            <div className="flex items-baseline gap-1 flex-wrap mb-1">
              <span className="font-bold text-[0.9375rem] text-white shrink-0">
                {post.display_name?.trim() || post.username}
              </span>
              <Link
                href={`/users/${post.username}`}
                className="text-[0.9375rem] text-muted shrink-0 hover:text-green"
              >
                @{post.username}
              </Link>
              <span className="text-[0.9375rem] text-muted shrink-0">
                · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
              {isDevUsername(post.username) && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.625rem] font-semibold tracking-wider uppercase bg-green/20 text-green border border-green/40 shrink-0 ml-1">
                  DEV
                </span>
              )}
            </div>
            
            {/* Review text */}
            {post.review ? (
              <p className="text-[0.9375rem] text-white leading-[1.4] whitespace-pre-wrap break-words">
                {post.review}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Engagement row - X style with even spacing */}
      <div className="border-t border-border/80" />
      <div className={`flex items-center py-2 text-muted ${POST_PADDING_X}`}>
        <div className="flex items-center gap-12 flex-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/community/${post.id}`);
            }}
            className="flex items-center gap-2 text-[0.8125rem] hover:text-white transition-colors"
          >
            <CommentIcon className="w-[1.125rem] h-[1.125rem]" />
            {post.comment_count > 0 && <span>{post.comment_count}</span>}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            disabled={!currentUserId}
            className={`flex items-center gap-2 text-[0.8125rem] hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors transform ${
              justLiked && liked ? "scale-110" : ""
            }`}
            aria-label={liked ? "Unlike" : "Like"}
          >
            {liked ? (
              <HeartFilledIcon className="w-[1.125rem] h-[1.125rem] text-pink-500" />
            ) : (
              <HeartIcon className="w-[1.125rem] h-[1.125rem]" />
            )}
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            className="flex items-center gap-2 text-[0.8125rem] hover:text-white transition-colors ml-auto"
            aria-label="Copy link"
          >
            <LinkIcon className="w-[1.125rem] h-[1.125rem]" />
            {copied ? <span className="text-green text-xs">Copied!</span> : null}
          </button>
        </div>
      </div>
    </article>
  );
}
