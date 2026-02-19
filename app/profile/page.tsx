"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getMyProfile, updateUsername } from "@/app/actions/profile";
import { checkUsername } from "@/app/(auth)/actions";

export default function ProfilePage() {
  const [profile, setProfile] = useState<{
    id: string;
    username: string;
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid" | "same">("idle");
  const [saveResult, setSaveResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    getMyProfile()
      .then((p) => {
        setProfile(p);
        if (p) setNewUsername(p.username);
      })
      .finally(() => setLoading(false));
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

  const handleSave = () => {
    const trimmed = newUsername.trim();
    if (!trimmed || trimmed === profile?.username) return;
    startTransition(async () => {
      const result = await updateUsername(trimmed);
      setSaveResult(result);
      if (result.success && profile) {
        setProfile({ ...profile, username: trimmed.toLowerCase() });
        setEditing(false);
        setUsernameStatus("same");
      }
    });
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="pt-20 md:pt-24 min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="pt-20 md:pt-24 min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted">Please log in to view your profile.</p>
        <Link href="/login">
          <Button variant="primary">Log in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-20 md:pt-24 min-h-screen">
      <div className="max-w-md mx-auto px-4 pb-24">
        <header className="py-8 border-b border-border">
          <div className="flex items-center gap-4">
            <span
              className="w-20 h-20 rounded-full bg-green-dim bg-cover bg-center shrink-0 flex items-center justify-center text-2xl"
              style={{ backgroundImage: profile.avatar_url ? `url(${profile.avatar_url})` : undefined }}
              aria-hidden
            >
              {!profile.avatar_url && profile.username[0]?.toUpperCase()}
            </span>
            <div>
              <h1 className="font-display text-2xl tracking-wide text-white">
                {profile.display_name || profile.username}
              </h1>
              <p className="text-sm text-muted font-mono">@{profile.username}</p>
              {profile.bio && <p className="text-sm text-muted mt-1">{profile.bio}</p>}
            </div>
          </div>
        </header>

        <section className="py-6">
          <h2 className="font-display text-lg tracking-wide mb-4">Account Settings</h2>

          <div className="bg-surface2 border border-border rounded-card p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono uppercase tracking-wider text-muted">
                  Username
                </label>
                {!editing && (
                  <button
                    type="button"
                    onClick={() => { setEditing(true); setSaveResult(null); }}
                    className="text-xs text-green hover:underline"
                  >
                    Change
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => handleUsernameInput(e.target.value)}
                    className="w-full rounded-badge border border-border2 bg-surface3 px-3 py-2 text-sm font-sans text-white placeholder:text-muted2 focus:outline-none focus:ring-1 focus:ring-green"
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
                    {saveResult?.error && (
                      <p className="text-xs text-red">{saveResult.error}</p>
                    )}
                    {saveResult?.success && (
                      <p className="text-xs text-green">Username updated!</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      className="flex-1"
                      disabled={
                        isPending ||
                        usernameStatus !== "available" ||
                        newUsername.trim() === profile.username
                      }
                      onClick={handleSave}
                    >
                      {isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setEditing(false);
                        setNewUsername(profile.username);
                        setUsernameStatus("same");
                        setSaveResult(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-white font-mono">@{profile.username}</p>
              )}
            </div>

            {profile.display_name && (
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted block mb-1">
                  Display Name
                </label>
                <p className="text-sm text-white">{profile.display_name}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
