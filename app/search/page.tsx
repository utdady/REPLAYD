"use client";

import { useState, useRef, useEffect } from "react";
import { searchUsers, followUser, unfollowUser } from "@/app/actions/social";

type UserResult = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_following: boolean;
};

function getInitials(displayName: string | null, username: string): string {
  if (displayName) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return displayName.substring(0, 2).toUpperCase();
  }
  return username.substring(0, 2).toUpperCase();
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleInput = (value: string) => {
    setQuery(value);
    const trimmed = value.trim();

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (trimmed.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const data = await searchUsers(trimmed);
      setResults(data);
      setHasSearched(true);
      setSearching(false);
    }, 400);
  };

  const handleFollow = async (userId: string) => {
    setLoadingFollow(userId);
    const result = await followUser(userId);
    if (result.success) {
      setResults((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_following: true } : u))
      );
    }
    setLoadingFollow(null);
  };

  const handleUnfollow = async (userId: string) => {
    setLoadingFollow(userId);
    const result = await unfollowUser(userId);
    if (result.success) {
      setResults((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_following: false } : u))
      );
    }
    setLoadingFollow(null);
  };

  return (
    <div className="pt-20 md:pt-24 min-h-screen main-content">
      <div className="max-w-[600px] mx-auto px-4 sm:px-6 pb-12">

        <h1 className="font-display text-3xl tracking-wide pt-4 pb-6">Search</h1>

        {/* Search input */}
        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="Search by username or name..."
            maxLength={100}
            className="w-full bg-surface2 border border-border rounded-card pl-10 pr-4 py-3 text-[.88rem] text-white font-sans placeholder:text-muted2 outline-none focus:border-border2 transition-colors"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setResults([]); setHasSearched(false); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-surface3 flex items-center justify-center text-[.85rem] text-muted hover:opacity-70 transition-opacity"
            >
              ×
            </button>
          )}
        </div>

        {/* Loading */}
        {searching && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-green border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Results */}
        {!searching && hasSearched && results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted text-sm">No users found for &ldquo;{query.trim()}&rdquo;</p>
          </div>
        )}

        {!searching && results.length > 0 && (
          <div className="flex flex-col gap-2">
            {results.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 bg-surface border border-border rounded-card px-4 py-3"
              >
                {/* Avatar */}
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.display_name ?? user.username}
                    className="w-11 h-11 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-green font-medium text-sm"
                    style={{ background: "linear-gradient(135deg, var(--surface3), var(--surface2))" }}
                  >
                    {getInitials(user.display_name, user.username)}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[.88rem] font-medium text-white truncate">
                    {user.display_name || user.username}
                  </p>
                  <p className="text-[.75rem] font-mono text-muted truncate">
                    @{user.username}
                  </p>
                </div>

                {/* Follow/Unfollow button */}
                {user.is_following ? (
                  <button
                    onClick={() => handleUnfollow(user.id)}
                    disabled={loadingFollow === user.id}
                    className="shrink-0 px-4 py-[.45rem] rounded-btn text-[.78rem] font-semibold bg-surface2 text-white border border-border2 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loadingFollow === user.id ? "..." : "Following"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleFollow(user.id)}
                    disabled={loadingFollow === user.id}
                    className="shrink-0 px-4 py-[.45rem] rounded-btn text-[.78rem] font-semibold bg-green text-black hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loadingFollow === user.id ? "..." : "Follow"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!searching && !hasSearched && (
          <div className="text-center py-16">
            <div className="text-3xl mb-4 opacity-30">🔍</div>
            <p className="text-muted text-sm">Search for people by username or name</p>
          </div>
        )}

      </div>
    </div>
  );
}
