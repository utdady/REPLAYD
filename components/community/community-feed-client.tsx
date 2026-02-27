"use client";

import * as React from "react";
import { getCommunityFeed, type CommunityTab, type CommunitySort, type CommunityFeedItem } from "@/app/actions/community";
import { CommunityPostCard } from "@/components/community/community-post-card";

export interface CommunityFeedClientProps {
  currentUserId: string | null;
}

export function CommunityFeedClient({ currentUserId }: CommunityFeedClientProps) {
  const [tab, setTab] = React.useState<CommunityTab>("feed");
  const [sort, setSort] = React.useState<CommunitySort>("newest");
  const [posts, setPosts] = React.useState<CommunityFeedItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchFeed = React.useCallback(async () => {
    setLoading(true);
    const data = await getCommunityFeed({ tab, sort, currentUserId });
    setPosts(data);
    setLoading(false);
  }, [tab, sort, currentUserId]);

  React.useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end mb-1">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as CommunitySort)}
          className="bg-surface2 border border-border rounded-btn px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-border2"
          aria-label="Sort by"
        >
          <option value="newest">Newest</option>
          <option value="trending">Trending</option>
        </select>
      </div>

      <div className="flex items-stretch border-b border-border">
        <button
          type="button"
          onClick={() => setTab("feed")}
          className={`flex-1 py-3 text-center text-sm font-medium relative ${
            tab === "feed" ? "text-white" : "text-muted hover:text-white"
          }`}
        >
          Feed
          {tab === "feed" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green" aria-hidden />
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("friends")}
          className={`flex-1 py-3 text-center text-sm font-medium relative ${
            tab === "friends" ? "text-white" : "text-muted hover:text-white"
          }`}
        >
          Friends
          {tab === "friends" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green" aria-hidden />
          )}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted py-8">Loading…</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted py-8">
          {tab === "friends"
            ? currentUserId
              ? "No posts from people you follow yet."
              : "Sign in to see posts from people you follow."
            : "No posts yet. Log a game to see it here."}
        </p>
      ) : (
        <ul className="space-y-3 list-none">
          {posts.map((post) => (
            <li key={post.id}>
              <CommunityPostCard
                post={post}
                currentUserId={currentUserId}
                onLikeToggle={fetchFeed}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
