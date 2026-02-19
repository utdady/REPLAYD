"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getMyProfile, updateUsername, getProfileStats, updateBio } from "@/app/actions/profile";
import { checkUsername } from "@/app/(auth)/actions";

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string | null;
};

type Stats = {
  matches_logged: number;
  avg_rating: number | null;
  lists_count: number;
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Username editing
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid" | "same">("idle");
  const [saveResult, setSaveResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Bio editing
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");
  const [bioSaving, setBioSaving] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<"matches" | "reviews" | "lists">("matches");

  useEffect(() => {
    Promise.all([getMyProfile(), getProfileStats()])
      .then(([p, s]) => {
        setProfile(p);
        setStats(s);
        if (p) {
          setNewUsername(p.username);
          setBioText(p.bio ?? "");
        }
      })
      .catch((err) => {
        console.error("Profile load error:", err);
        setLoadError(err instanceof Error ? err.message : "Failed to load profile");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleUsernameInput = (value: string) => {
    setNewUsername(value);
    setSaveResult(null);
    const trimmed = value.trim();

    if (!trimmed || trimmed === profile?.username) {
      setUsernameStatus(trimmed === profile?.username ? "same" : "idle");
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(trimmed)) {
      setUsernameStatus("invalid");
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setUsernameStatus("checking");
      const result = await checkUsername(trimmed);
      setUsernameStatus(result.available ? "available" : "taken");
    }, 400);
  };

  const handleUsernameSave = () => {
    const trimmed = newUsername.trim();
    if (!trimmed || trimmed === profile?.username) return;
    startTransition(async () => {
      const result = await updateUsername(trimmed);
      setSaveResult(result);
      if (result.success && profile) {
        setProfile({ ...profile, username: trimmed.toLowerCase() });
        setEditingUsername(false);
        setUsernameStatus("same");
      }
    });
  };

  const handleBioSave = async () => {
    setBioSaving(true);
    const result = await updateBio(bioText);
    if (result.success && profile) {
      setProfile({ ...profile, bio: bioText.trim() || null });
      setEditingBio(false);
    }
    setBioSaving(false);
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

  return (
    <div className="pt-16 md:pt-20 min-h-screen main-content">
      <div className="max-w-[600px] mx-auto px-4 sm:px-6 pb-12">

        {/* ── HEADER ───────────────────────────────────────── */}
        <div className="relative text-center pt-8 pb-6">
          {/* Cover gradient */}
          <div
            className="absolute -top-16 -left-4 -right-4 sm:-left-6 sm:-right-6 h-[180px] border-b border-border z-0"
            style={{ background: "linear-gradient(135deg, rgba(61,220,132,0.08) 0%, rgba(61,220,132,0.03) 100%)" }}
          />

          {/* Avatar */}
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

          {/* Name & handle */}
          <h1 className="font-display text-[2rem] tracking-[.05em] leading-none text-white mb-1">
            {profile.display_name || profile.username}
          </h1>
          <p className="font-mono text-[.82rem] text-muted tracking-[.04em] mb-5">
            @{profile.username}
          </p>

          {/* Stats row */}
          <div className="flex justify-center gap-10 mb-6">
            <div className="flex flex-col items-center gap-1">
              <span className="font-display text-[1.8rem] tracking-[.05em] leading-none text-white">
                {stats.matches_logged}
              </span>
              <span className="font-mono text-[.62rem] tracking-[.1em] uppercase text-muted">
                Matches
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
            <div className="flex flex-col items-center gap-1">
              <span className="font-display text-[1.8rem] tracking-[.05em] leading-none text-white">
                {stats.lists_count}
              </span>
              <span className="font-mono text-[.62rem] tracking-[.1em] uppercase text-muted">
                Lists
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setEditingUsername(true)}
              className="px-8 py-3 rounded-btn text-[.85rem] font-semibold tracking-[.03em] bg-green text-black hover:opacity-90 transition-opacity"
            >
              Edit profile
            </button>
            <button className="px-8 py-3 rounded-btn text-[.85rem] font-semibold tracking-[.03em] bg-surface2 text-white border border-border2 hover:opacity-90 transition-opacity">
              Share
            </button>
          </div>
        </div>

        {/* ── ABOUT ────────────────────────────────────────── */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[.9rem] font-semibold tracking-[.02em] text-muted">About</h2>
          </div>

          <div className="bg-surface border border-border rounded-card p-6">
            {/* Bio */}
            {editingBio ? (
              <div className="mb-4 space-y-3">
                <textarea
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  maxLength={300}
                  rows={3}
                  className="w-full rounded-badge border border-border2 bg-surface3 px-3 py-2 text-[.88rem] leading-relaxed font-sans text-white placeholder:text-muted2 focus:outline-none focus:ring-1 focus:ring-green resize-none"
                  placeholder="Tell us about yourself..."
                />
                <div className="flex items-center justify-between">
                  <span className="text-[.7rem] text-muted2">{bioText.length}/300</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleBioSave}
                      disabled={bioSaving}
                      className="px-4 py-2 rounded-btn text-xs font-semibold bg-green text-black hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {bioSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => { setEditingBio(false); setBioText(profile.bio ?? ""); }}
                      className="px-4 py-2 rounded-btn text-xs font-semibold bg-surface2 text-white border border-border2 hover:opacity-90 transition-opacity"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : profile.bio ? (
              <p
                className="text-[.88rem] leading-relaxed text-white mb-4 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setEditingBio(true)}
              >
                {profile.bio}
              </p>
            ) : (
              <p
                className="text-[.85rem] text-muted italic mb-4 cursor-pointer hover:text-white transition-colors"
                onClick={() => setEditingBio(true)}
              >
                Add a bio
              </p>
            )}

            {/* Meta */}
            <div className="flex flex-col gap-[.65rem]">
              <div className="flex items-center gap-3 text-[.78rem] text-muted">
                <span className="w-5 text-center text-base">📅</span>
                <span>Joined {formatJoinDate(profile.created_at)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── USERNAME EDITOR (shown on Edit profile click) ── */}
        {editingUsername && (
          <section className="mt-6">
            <div className="bg-surface border border-border rounded-card p-6 space-y-4">
              <h3 className="text-[.9rem] font-semibold tracking-[.02em] text-muted">
                Change Username
              </h3>
              <div className="space-y-2">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => handleUsernameInput(e.target.value)}
                  className="w-full rounded-badge border border-border2 bg-surface3 px-3 py-2 text-sm font-mono text-white placeholder:text-muted2 focus:outline-none focus:ring-1 focus:ring-green"
                  placeholder="New username"
                  maxLength={30}
                  minLength={3}
                />
                <div className="min-h-[16px]">
                  {usernameStatus === "checking" && (
                    <p className="text-xs text-muted">Checking...</p>
                  )}
                  {usernameStatus === "available" && (
                    <p className="text-xs text-green">&#10003; Username available</p>
                  )}
                  {usernameStatus === "taken" && (
                    <p className="text-xs text-red">&#10007; Username already taken</p>
                  )}
                  {usernameStatus === "invalid" && newUsername.trim().length > 0 && (
                    <p className="text-xs text-red">3-30 characters, letters, numbers, and underscores only</p>
                  )}
                  {usernameStatus === "same" && (
                    <p className="text-xs text-muted2">Current username</p>
                  )}
                  {saveResult?.error && <p className="text-xs text-red">{saveResult.error}</p>}
                  {saveResult?.success && <p className="text-xs text-green">Username updated!</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 px-4 py-2 rounded-btn text-sm font-semibold bg-green text-black hover:opacity-90 transition-opacity disabled:opacity-50"
                    disabled={isPending || usernameStatus !== "available" || newUsername.trim() === profile.username}
                    onClick={handleUsernameSave}
                  >
                    {isPending ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="flex-1 px-4 py-2 rounded-btn text-sm font-semibold bg-surface2 text-white border border-border2 hover:opacity-90 transition-opacity"
                    onClick={() => {
                      setEditingUsername(false);
                      setNewUsername(profile.username);
                      setUsernameStatus("same");
                      setSaveResult(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── RUSHMORE ──────────────────────────────────────── */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[.9rem] font-semibold tracking-[.02em] text-muted">Rushmore</h2>
            <span className="text-[.78rem] text-green cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1">
              Edit ›
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {[1, 2, 3, 4].map((slot) => (
              <div
                key={slot}
                className="min-w-[140px] shrink-0 aspect-square bg-surface2 border border-dashed border-border2 rounded-card flex flex-col items-center justify-center gap-2"
              >
                <span className="text-2xl opacity-30">+</span>
                <span className="font-mono text-[.62rem] tracking-[.08em] uppercase text-muted2">
                  Add match
                </span>
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
            <div className="font-display text-[1.3rem] tracking-[.05em] text-muted2 mb-1">
              Coming Soon
            </div>
            <p className="text-[.78rem] text-muted leading-relaxed">
              Match frequency, rating distribution, favorite teams, and more.
            </p>
          </div>
        </section>

        {/* ── FAVORITES (coming soon) ──────────────────────── */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[.9rem] font-semibold tracking-[.02em] text-muted">Favorites</h2>
          </div>
          <div className="bg-surface border border-dashed border-border2 rounded-card py-10 px-6 text-center">
            <div className="text-2xl mb-3 opacity-30">⭐</div>
            <div className="font-display text-[1.3rem] tracking-[.05em] text-muted2 mb-1">
              Coming Soon
            </div>
            <p className="text-[.78rem] text-muted leading-relaxed">
              Showcase your favorite players, teams, and clubs across all competitions.
            </p>
          </div>
        </section>

        {/* ── TABS ──────────────────────────────────────────── */}
        <div className="flex border-b border-border mt-10 mb-6">
          {(["matches", "reviews", "lists"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative text-[.78rem] font-medium px-5 py-3 capitalize transition-colors ${
                activeTab === tab ? "text-white" : "text-muted2 hover:text-muted"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-green" />
              )}
            </button>
          ))}
        </div>

        <div className="py-8 text-center text-muted text-[.85rem]">
          {activeTab === "matches" && "Recent match logs will appear here..."}
          {activeTab === "reviews" && "Your reviews will appear here..."}
          {activeTab === "lists" && "Your lists will appear here..."}
        </div>

      </div>
    </div>
  );
}
