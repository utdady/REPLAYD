"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getMyProfile, getProfileStats } from "@/app/actions/profile";
import { getFollowCounts, getFollowersList, getFollowingList } from "@/app/actions/social";
import { getListsForCurrentUser } from "@/app/actions/list";
import type { ListSummary } from "@/app/actions/list";
import { isDevUsername } from "@/lib/follow-the-goat";

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  created_at: string | null;
  instagram: string | null;
  twitter: string | null;
  tiktok: string | null;
  youtube: string | null;
};

type Stats = {
  matches_logged: number;
  avg_rating: number | null;
  lists_count: number;
};

type FollowUser = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

function getInitials(displayName: string | null, username: string): string {
  if (displayName) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return displayName.substring(0, 2).toUpperCase();
  }
  return username.substring(0, 2).toUpperCase();
}

function formatJoinDate(dateStr: string | null): string {
  if (!dateStr) return "Recently joined";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({ matches_logged: 0, avg_rating: null, lists_count: 0 });
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"games" | "reviews" | "lists">("games");

  // Follow list modal
  const [listModal, setListModal] = useState<"followers" | "following" | null>(null);
  const [listUsers, setListUsers] = useState<FollowUser[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [lists, setLists] = useState<ListSummary[]>([]);

  useEffect(() => {
    Promise.all([getMyProfile(), getProfileStats()])
      .then(async ([p, s]) => {
        setProfile(p as Profile | null);
        setStats(s);
        if (p) {
          const counts = await getFollowCounts(p.id);
          setFollowers(counts.followers);
          setFollowing(counts.following);
          const userLists = await getListsForCurrentUser();
          setLists(userLists);
        }
      })
      .catch((err) => {
        console.error("Profile load error:", err);
        setLoadError(err instanceof Error ? err.message : "Failed to load profile");
      })
      .finally(() => setLoading(false));
  }, []);

  const openFollowList = async (type: "followers" | "following") => {
    if (!profile) return;
    setListModal(type);
    setListLoading(true);
    const users = type === "followers"
      ? await getFollowersList(profile.id)
      : await getFollowingList(profile.id);
    setListUsers(users as FollowUser[]);
    setListLoading(false);
  };

  if (loading) {
    return (
      <div className="pt-20 md:pt-24 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-green border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="pt-20 md:pt-24 min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted">
          {loadError ? `Error: ${loadError}` : "Please log in to view your profile."}
        </p>
        <Link href="/login">
          <Button variant="primary">Log in</Button>
        </Link>
      </div>
    );
  }

  const initials = getInitials(profile.display_name, profile.username);
  const hasSocials = profile.instagram || profile.twitter || profile.tiktok || profile.youtube;

  return (
    <div className="pt-16 md:pt-20 min-h-screen main-content">
      <div className="max-w-[600px] mx-auto px-4 sm:px-6 pb-12">

        {/* ── FOLLOW LIST MODAL ──────────────────────────── */}
        {listModal && (
          <>
            <div
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={() => setListModal(null)}
            />
            <div className="fixed inset-x-4 top-[15vh] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[400px] z-[70] bg-surface border border-border rounded-xl max-h-[60vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                <h3 className="text-[1rem] font-semibold text-white capitalize">{listModal}</h3>
                <button
                  onClick={() => setListModal(null)}
                  className="w-8 h-8 rounded-full bg-surface3 flex items-center justify-center text-muted hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-3">
                {listLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-green border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : listUsers.length === 0 ? (
                  <p className="text-center text-muted text-sm py-8">
                    {listModal === "followers" ? "No followers yet" : "Not following anyone yet"}
                  </p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {listUsers.map((u) => (
                      <Link
                        key={u.id}
                        href={`/users/${u.username}`}
                        onClick={() => setListModal(null)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-card hover:bg-surface2 transition-colors"
                      >
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt={u.display_name ?? u.username}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-green font-medium text-xs"
                            style={{ background: "linear-gradient(135deg, var(--surface3), var(--surface2))" }}
                          >
                            {getInitials(u.display_name, u.username)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[.85rem] font-medium text-white truncate">
                            {u.display_name || u.username}
                          </p>
                          <p className="text-[.72rem] font-mono text-muted truncate">
                            @{u.username}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── HEADER ───────────────────────────────────────── */}
        <div className="relative text-center pt-8 pb-6">
          <div
            className="absolute -top-16 -left-4 -right-4 sm:-left-6 sm:-right-6 h-[180px] border-b border-border z-0 overflow-hidden"
            style={!profile.cover_url ? { background: "linear-gradient(135deg, rgba(61,220,132,0.08) 0%, rgba(61,220,132,0.03) 100%)" } : undefined}
          >
            {profile.cover_url && (
              <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />
            )}
          </div>

          <div className="relative z-[1] inline-block mb-5">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name ?? profile.username}
                className="w-[120px] h-[120px] rounded-full border-4 border-black object-cover"
                style={{ boxShadow: "0 0 40px rgba(0,0,0,0.6)" }}
              />
            ) : (
              <div
                className="w-[120px] h-[120px] rounded-full border-4 border-black flex items-center justify-center text-green font-medium"
                style={{
                  background: "linear-gradient(135deg, var(--surface3), var(--surface2))",
                  fontSize: "3rem",
                  boxShadow: "0 0 40px rgba(0,0,0,0.6)",
                }}
              >
                {initials}
              </div>
            )}
          </div>

          <h1 className="font-display text-[2rem] tracking-[.05em] leading-none text-white mb-1 flex items-center justify-center gap-2 flex-wrap">
            {profile.display_name || profile.username}
            {isDevUsername(profile.username) && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[.65rem] font-semibold tracking-wider uppercase bg-green/20 text-green border border-green/40">
                DEV
              </span>
            )}
          </h1>
          <p className="font-mono text-[.82rem] text-muted tracking-[.04em] mb-5">
            @{profile.username}
          </p>

          <div className="flex justify-center gap-7 sm:gap-10 mb-6">
            <div className="flex flex-col items-center gap-1">
              <span className="font-display text-[1.8rem] tracking-[.05em] leading-none text-white">
                {stats.matches_logged}
              </span>
              <span className="font-mono text-[.62rem] tracking-[.1em] uppercase text-muted">
                Games
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="font-display text-[1.8rem] tracking-[.05em] leading-none text-white">
                {stats.avg_rating !== null ? stats.avg_rating.toFixed(1) : "—"}
              </span>
              <span className="font-mono text-[.62rem] tracking-[.1em] uppercase text-muted">
                Avg Rating
              </span>
            </div>
            <button onClick={() => openFollowList("followers")} className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity">
              <span className="font-display text-[1.8rem] tracking-[.05em] leading-none text-white">
                {followers}
              </span>
              <span className="font-mono text-[.62rem] tracking-[.1em] uppercase text-muted">
                Followers
              </span>
            </button>
            <button onClick={() => openFollowList("following")} className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity">
              <span className="font-display text-[1.8rem] tracking-[.05em] leading-none text-white">
                {following}
              </span>
              <span className="font-mono text-[.62rem] tracking-[.1em] uppercase text-muted">
                Following
              </span>
            </button>
          </div>

          <div className="flex gap-3 justify-center">
            <Link
              href="/profile/edit"
              className="px-8 py-3 rounded-btn text-[.85rem] font-semibold tracking-[.03em] bg-green text-black hover:opacity-90 transition-opacity"
            >
              Edit profile
            </Link>
            <button className="px-8 py-3 rounded-btn text-[.85rem] font-semibold tracking-[.03em] bg-surface2 text-white border border-border2 hover:opacity-90 transition-opacity">
              Share
            </button>
          </div>
        </div>

        {/* ── ABOUT ────────────────────────────────────────── */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[.9rem] font-semibold tracking-[.02em] text-muted">About</h2>
            {hasSocials && (
              <span className="text-[.78rem] text-green">Socials ›</span>
            )}
          </div>

          <div className="bg-surface border border-border rounded-card p-6">
            {profile.bio ? (
              <p className="text-[.88rem] leading-relaxed text-white mb-4">{profile.bio}</p>
            ) : (
              <p className="text-[.85rem] text-muted italic mb-4">No bio yet</p>
            )}

            <div className="flex flex-col gap-[.65rem]">
              <div className="flex items-center gap-3 text-[.78rem] text-muted">
                <span className="w-5 text-center text-base">📅</span>
                <span>Joined {formatJoinDate(profile.created_at)}</span>
              </div>
              {profile.twitter && (
                <div className="flex items-center gap-3 text-[.78rem] text-muted">
                  <span className="w-5 text-center text-base font-semibold" style={{ fontFamily: "serif" }}>𝕏</span>
                  <a href={`https://x.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer" className="text-green hover:opacity-80 transition-opacity">@{profile.twitter}</a>
                </div>
              )}
              {profile.instagram && (
                <div className="flex items-center gap-3 text-[.78rem] text-muted">
                  <span className="w-5 text-center text-base">📷</span>
                  <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer" className="text-green hover:opacity-80 transition-opacity">@{profile.instagram}</a>
                </div>
              )}
              {profile.tiktok && (
                <div className="flex items-center gap-3 text-[.78rem] text-muted">
                  <span className="w-5 text-center text-base">🎵</span>
                  <a href={`https://tiktok.com/@${profile.tiktok}`} target="_blank" rel="noopener noreferrer" className="text-green hover:opacity-80 transition-opacity">@{profile.tiktok}</a>
                </div>
              )}
              {profile.youtube && (
                <div className="flex items-center gap-3 text-[.78rem] text-muted">
                  <span className="w-5 text-center text-base">▶️</span>
                  <a href={`https://youtube.com/${profile.youtube}`} target="_blank" rel="noopener noreferrer" className="text-green hover:opacity-80 transition-opacity">{profile.youtube}</a>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── RUSHMORE ──────────────────────────────────────── */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[.9rem] font-semibold tracking-[.02em] text-muted">Rushmore</h2>
            <span className="text-[.78rem] text-green cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1">Edit ›</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {[1, 2, 3, 4].map((slot) => (
              <div key={slot} className="min-w-[140px] shrink-0 aspect-square bg-surface2 border border-dashed border-border2 rounded-card flex flex-col items-center justify-center gap-2">
                <span className="text-2xl opacity-30">+</span>
                <span className="font-mono text-[.62rem] tracking-[.08em] uppercase text-muted2">Add game</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── STATS (coming soon) ──────────────────────────── */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[.9rem] font-semibold tracking-[.02em] text-muted">Stats</h2>
          </div>
          <div className="bg-surface border border-dashed border-border2 rounded-card py-10 px-6 text-center">
            <div className="text-2xl mb-3 opacity-30">📊</div>
            <div className="font-display text-[1.3rem] tracking-[.05em] text-muted2 mb-1">Coming Soon</div>
            <p className="text-[.78rem] text-muted leading-relaxed">Game frequency, rating distribution, favorite teams, and more.</p>
          </div>
        </section>

        {/* ── FAVORITES (coming soon) ──────────────────────── */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[.9rem] font-semibold tracking-[.02em] text-muted">Favorites</h2>
          </div>
          <div className="bg-surface border border-dashed border-border2 rounded-card py-10 px-6 text-center">
            <div className="text-2xl mb-3 opacity-30">⭐</div>
            <div className="font-display text-[1.3rem] tracking-[.05em] text-muted2 mb-1">Coming Soon</div>
            <p className="text-[.78rem] text-muted leading-relaxed">Showcase your favorite players, teams, and clubs across all competitions.</p>
          </div>
        </section>

        {/* ── TABS ──────────────────────────────────────────── */}
        <div className="flex border-b border-border mt-10 mb-6">
          {(["games", "reviews", "lists"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative text-[.78rem] font-medium px-5 py-3 capitalize transition-colors ${activeTab === tab ? "text-white" : "text-muted2 hover:text-muted"}`}
            >
              {tab}
              {activeTab === tab && <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-green" />}
            </button>
          ))}
        </div>

        <div className="py-8 text-center text-muted text-[.85rem]">
          {activeTab === "games" && "Recent game logs will appear here..."}
          {activeTab === "reviews" && "Your reviews will appear here..."}
          {activeTab === "lists" && (
            lists.length === 0 ? (
              "Your lists will appear here..."
            ) : (
              <div className="text-left space-y-3">
                {lists.map((list) => (
                  <Link
                    key={list.id}
                    href={`/lists/${list.id}`}
                    className="block p-4 rounded-card bg-surface border border-border hover:border-border2 transition-colors"
                  >
                    <h3 className="font-medium text-white">{list.title}</h3>
                    {list.description && (
                      <p className="text-sm text-muted mt-1 line-clamp-2">{list.description}</p>
                    )}
                    <p className="text-xs font-mono text-muted mt-2">
                      {list.item_count} item{list.item_count !== 1 ? "s" : ""}
                    </p>
                  </Link>
                ))}
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
}
