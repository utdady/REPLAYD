import Link from "next/link";
import { StarRating } from "@/components/ui/star-rating";

export interface LogFeedItemProps {
  username: string;
  avatarUrl?: string | null;
  rating: number | null;
  reviewSnippet?: string | null;
  matchTitle: string;
  matchId: string;
  logId: string;
}

export function LogFeedItem({
  username,
  avatarUrl,
  rating,
  reviewSnippet,
  matchTitle,
  matchId,
  logId,
}: LogFeedItemProps) {
  return (
    <article className="flex gap-3 p-3 rounded-card bg-surface2 border border-border">
      <Link href={`/users/${username}`} className="shrink-0">
        <span
          className="block w-10 h-10 rounded-full bg-green-dim bg-cover bg-center"
          style={{ backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined }}
          aria-hidden
        />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/users/${username}`} className="text-sm font-sans font-medium text-white hover:text-green">
            {username}
          </Link>
          {rating != null ? (
            <StarRating value={rating} size="sm" readonly />
          ) : null}
        </div>
        {reviewSnippet ? (
          <p className="text-sm font-sans text-muted mt-0.5 line-clamp-2">{reviewSnippet}</p>
        ) : null}
        <Link
          href={`/matches/${matchId}`}
          className="text-xs font-mono text-muted2 hover:text-green mt-1 inline-block"
        >
          {matchTitle}
        </Link>
      </div>
    </article>
  );
}
