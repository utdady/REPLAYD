"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getUserProfile,
  getFollowCounts,
  getFollowersList,
  getFollowingList,
  followUser,
  unfollowUser,
} from "@/app/actions/social";
import { getMyProfile } from "@/app/actions/profile";
import { getPublicListsByUserId } from "@/app/actions/list";
import type { ListSummary } from "@/app/actions/list";

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

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = typeof params.username === "string" ? params.username : "";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [listModal, setListModal] = useState<"followers" | "following" | null>(null);
  const [listUsers, setListUsers] = useState<FollowUser[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [publicLists, setPublicLists] = useState<ListSummary[]>([]);

  useEffect(() => {
    if (!username) return;

    (async () => {
      const [userProfile, myProfile] = await Promise.all([
        getUserProfile(username),
        getMyProfile().catch(() => null),
      ]);

      if (!userProfile) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (myProfile && myProfile.username === userProfile.username) {
        router.replace("/profile");
        return;
      }

      setProfile(userProfile as Profile);
      setMyId(myProfile?.id ?? null);

      const counts = await getFollowCounts(userProfile.id);
      setFollowers(counts.followers);
      setFollowing(counts.following);

      const lists = await getPublicListsByUserId(userProfile.id);
      setPublicLists(lists);

      if (myProfile) {
        const followersList = await getFollowersList(userProfile.id);
        setIsFollowing(followersList.some((f) => f.id === myProfile.id));
      }

      setLoading(false);
    })();
  }, [username, router]);

  const handleFollow = async () => {
    if (!profile || !myId) return;
    setFollowLoading(true);
    const res = await followUser(profile.id);
    if (res.success) {
      setIsFollowing(true);
      setFollowers((c) => c + 1);
    }
    setFollowLoading(false);
  };

  const handleUnfollow = async () => {
    if (!profile || !myId) return;
    setFollowLoading(true);
    const res = await unfollowUser(profile.id);
    if (res.success) {
      setIsFollowing(false);
      setFollowers((c) => Math.max(0, c - 1));
    }
    setFollowLoading(false);
  };

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

  if (notFound || !profile) {
    return (
      <div className="pt-20 md:pt-24 min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted text-sm">User not found</p>
        <Link href="/search" className="text-green text-sm hover:opacity-80 transition-opacity">
          Back to Search
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
              <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                <h3 className="text-[1rem] font-semibold text-white capitalize">{listModal}</h3>
                <button
                  onClick={() => setListModal(null)}
                  className="w-8 h-8 rounded-full bg-surface3 flex items-center justify-center text-muted hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>
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

          <h1 className="font-display text-[2rem] tracking-[.05em] leading-none text-white mb-1">
            {profile.display_name || profile.username}
          </h1>
          <p className="font-mono text-[.82rem] text-muted tracking-[.04em] mb-5">
            @{profile.username}
          </p>

          <div className="flex justify-center gap-7 sm:gap-10 mb-6">
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
            {myId ? (
              isFollowing ? (
                <button
                  onClick={handleUnfollow}
                  disabled={followLoading}
                  className="px-8 py-3 rounded-btn text-[.85rem] font-semibold tracking-[.03em] bg-surface2 text-white border border-border2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {followLoading ? "..." : "Following"}
                </button>
              ) : (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className="px-8 py-3 rounded-btn text-[.85rem] font-semibold tracking-[.03em] bg-green text-black hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {followLoading ? "..." : "Follow"}
                </button>
              )
            ) : (
              <Link
                href="/login"
                className="px-8 py-3 rounded-btn text-[.85rem] font-semibold tracking-[.03em] bg-green text-black hover:opacity-90 transition-opacity"
              >
                Log in to follow
              </Link>
            )}
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

        {/* ── LISTS ────────────────────────────────────────── */}
        {publicLists.length > 0 && (
          <section className="mt-10">
            <h2 className="text-[.9rem] font-semibold tracking-[.02em] text-muted mb-4">Lists</h2>
            <div className="space-y-3">
              {publicLists.map((list) => (
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
          </section>
        )}

      </div>
    </div>
  );
}
