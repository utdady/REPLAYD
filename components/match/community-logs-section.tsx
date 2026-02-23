"use client";

import * as React from "react";
import { getLogsForMatch, type LogForMatchRow, type LogsSortBy } from "@/app/actions/match";
import { LogFeedItem } from "@/components/feed/log-feed-item";

export interface CommunityLogsSectionProps {
  initialLogs: LogForMatchRow[];
  matchId: string;
  matchTitle: string;
  currentUserId: string | null;
}

export function CommunityLogsSection({
  initialLogs,
  matchId,
  matchTitle,
  currentUserId,
}: CommunityLogsSectionProps) {
  const [logs, setLogs] = React.useState<LogForMatchRow[]>(initialLogs);
  const [sortBy, setSortBy] = React.useState<LogsSortBy>("likes");
  const [filterByFriends, setFilterByFriends] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

  const refreshLogs = React.useCallback(async () => {
    setLoading(true);
    const next = await getLogsForMatch(matchId, {
      sortBy,
      filterByFriends,
      currentUserId,
    });
    setLogs(next);
    setLoading(false);
  }, [matchId, sortBy, filterByFriends, currentUserId]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as LogsSortBy;
    setSortBy(value);
    setLoading(true);
    getLogsForMatch(matchId, { sortBy: value, filterByFriends, currentUserId })
      .then(setLogs)
      .finally(() => setLoading(false));
  };

  const handleFriendsToggle = () => {
    const next = !filterByFriends;
    setFilterByFriends(next);
    setLoading(true);
    getLogsForMatch(matchId, { sortBy, filterByFriends: next, currentUserId })
      .then(setLogs)
      .finally(() => setLoading(false));
  };

  return (
    <section className="py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold">Community logs</h3>
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="bg-surface2 border border-border rounded-btn px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-border2"
            aria-label="Sort by"
          >
            <option value="likes">Likes</option>
            <option value="recency">Recency</option>
          </select>
          {currentUserId && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterByFriends}
                onChange={handleFriendsToggle}
                className="rounded border-border bg-surface2 text-green focus:ring-green"
              />
              <span className="text-xs font-mono text-muted">Friends</span>
            </label>
          )}
        </div>
      </div>
      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted">No logs yet. Be the first to log this game.</p>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <LogFeedItem
              key={log.id}
              username={log.username}
              avatarUrl={log.avatar_url}
              rating={log.rating}
              reviewSnippet={log.review ? log.review.slice(0, 100) : null}
              matchTitle={matchTitle}
              matchId={matchId}
              logId={log.id}
              likeCount={log.like_count}
            />
          ))}
        </div>
      )}
    </section>
  );
}
