"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getMyProfile, updateProfile, updateUsername,
  uploadAvatar, uploadCover, removeAvatar, removeCover,
} from "@/app/actions/profile";
import { checkUsername } from "@/app/(auth)/actions";

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

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_MB = 2;
const MAX_COVER_MB = 4;

function getInitials(displayName: string | null, username: string): string {
  if (displayName) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return displayName.substring(0, 2).toUpperCase();
  }
  return username.substring(0, 2).toUpperCase();
}

function validateFile(file: File, maxMB: number): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return "Only JPEG, PNG, and WebP are allowed";
  if (file.size > maxMB * 1024 * 1024) return `File must be under ${maxMB} MB (yours is ${(file.size / 1024 / 1024).toFixed(1)} MB)`;
  return null;
}

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form fields
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [youtube, setYoutube] = useState("");

  // Image uploads
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Username editing
  const [showUsernameEditor, setShowUsernameEditor] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid" | "same">("idle");
  const [usernameSaveResult, setUsernameSaveResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Bio editing
  const [showBioEditor, setShowBioEditor] = useState(false);

  useEffect(() => {
    getMyProfile()
      .then((p) => {
        if (!p) return;
        const prof = p as Profile;
        setProfile(prof);
        setDisplayName(prof.display_name ?? "");
        setBio(prof.bio ?? "");
        setNewUsername(prof.username);
        setInstagram(prof.instagram ?? "");
        setTwitter(prof.twitter ?? "");
        setTiktok(prof.tiktok ?? "");
        setYoutube(prof.youtube ?? "");
        if (prof.avatar_url) setAvatarPreview(prof.avatar_url);
        if (prof.cover_url) setCoverPreview(prof.cover_url);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ── Avatar upload ──────────────────────────
  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const err = validateFile(file, MAX_AVATAR_MB);
    if (err) { setImageError(err); return; }
    setImageError(null);

    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setAvatarUploading(true);

    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadAvatar(fd);

    setAvatarUploading(false);
    if (result.success && result.url) {
      setAvatarPreview(result.url);
      if (profile) setProfile({ ...profile, avatar_url: result.url });
    } else {
      setImageError(result.error ?? "Upload failed");
      setAvatarPreview(profile?.avatar_url ?? null);
    }
  };

  const handleAvatarRemove = async () => {
    setAvatarUploading(true);
    setImageError(null);
    const result = await removeAvatar();
    setAvatarUploading(false);
    if (result.success) {
      setAvatarPreview(null);
      if (profile) setProfile({ ...profile, avatar_url: null });
    } else {
      setImageError(result.error ?? "Failed to remove avatar");
    }
  };

  // ── Cover upload ──────────────────────────
  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const err = validateFile(file, MAX_COVER_MB);
    if (err) { setImageError(err); return; }
    setImageError(null);

    const preview = URL.createObjectURL(file);
    setCoverPreview(preview);
    setCoverUploading(true);

    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadCover(fd);

    setCoverUploading(false);
    if (result.success && result.url) {
      setCoverPreview(result.url);
      if (profile) setProfile({ ...profile, cover_url: result.url });
    } else {
      setImageError(result.error ?? "Upload failed");
      setCoverPreview(profile?.cover_url ?? null);
    }
  };

  const handleCoverRemove = async () => {
    setCoverUploading(true);
    setImageError(null);
    const result = await removeCover();
    setCoverUploading(false);
    if (result.success) {
      setCoverPreview(null);
      if (profile) setProfile({ ...profile, cover_url: null });
    } else {
      setImageError(result.error ?? "Failed to remove cover");
    }
  };

  // ── Username ──────────────────────────────
  const handleUsernameInput = (value: string) => {
    setNewUsername(value);
    setUsernameSaveResult(null);
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
      setUsernameSaveResult(result);
      if (result.success && profile) {
        setProfile({ ...profile, username: trimmed.toLowerCase() });
        setShowUsernameEditor(false);
        setUsernameStatus("same");
      }
    });
  };

  // ── Save all ──────────────────────────────
  const handleDone = async () => {
    if (!profile) return;
    setSaving(true);
    const result = await updateProfile({
      display_name: displayName,
      bio,
      instagram,
      twitter,
      tiktok,
      youtube,
    });
    setSaving(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => router.push("/profile"), 300);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-green border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted">Please log in to edit your profile.</p>
        <Link href="/login" className="px-6 py-2 rounded-btn text-sm font-semibold bg-green text-black">
          Log in
        </Link>
      </div>
    );
  }

  const initials = getInitials(profile.display_name, profile.username);

  return (
    <div className="min-h-screen bg-black">
      {/* Hidden file inputs */}
      <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarSelect} />
      <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverSelect} />

      {/* ── TOP BAR ────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 py-5 bg-black border-b border-border">
        <Link
          href="/profile"
          className="text-[.9rem] text-muted hover:text-white transition-colors"
        >
          Cancel
        </Link>
        <span className="text-[1.05rem] font-medium tracking-[.02em] text-white">
          Edit profile
        </span>
        <button
          onClick={handleDone}
          disabled={saving || avatarUploading || coverUploading}
          className="text-[.9rem] font-semibold text-green hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Done"}
        </button>
      </div>

      {/* ── CONTENT ────────────────────────────────────── */}
      <div className="max-w-[600px] mx-auto px-6 pt-[5rem] pb-12">

        {/* Image error banner */}
        {imageError && (
          <div className="mb-4 p-3 rounded-card bg-red/10 border border-red/30 text-red text-sm flex items-center justify-between">
            <span>{imageError}</span>
            <button onClick={() => setImageError(null)} className="text-red hover:opacity-70 ml-3 shrink-0">×</button>
          </div>
        )}

        {/* ── COVER & AVATAR ───────────────────────────── */}
        <div className="relative mb-16">
          {/* Cover banner */}
          <div
            className="h-[160px] rounded-xl border border-border relative flex items-center justify-center overflow-hidden group cursor-pointer"
            style={!coverPreview ? { background: "linear-gradient(135deg, rgba(61,220,132,0.08) 0%, rgba(61,220,132,0.03) 100%)" } : undefined}
            onClick={() => !coverUploading && coverInputRef.current?.click()}
          >
            {coverPreview && (
              <img src={coverPreview} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
            )}

            {coverUploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                <div className="w-6 h-6 border-2 border-green border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Cover action buttons */}
            <div className="absolute top-3 right-3 flex gap-2 z-10">
              {coverPreview && !coverUploading && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleCoverRemove(); }}
                  className="w-9 h-9 rounded-full bg-black/70 flex items-center justify-center text-red text-sm font-semibold hover:opacity-90 transition-opacity"
                  title="Remove cover"
                >
                  ×
                </button>
              )}
              {!coverUploading && (
                <button
                  onClick={(e) => { e.stopPropagation(); coverInputRef.current?.click(); }}
                  className="w-9 h-9 rounded-full bg-green flex items-center justify-center text-black text-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  +
                </button>
              )}
            </div>

            {!coverPreview && !coverUploading && (
              <span className="text-[.72rem] text-muted2 italic">Tap to add cover photo (max {MAX_COVER_MB} MB)</span>
            )}
          </div>

          {/* Avatar */}
          <div className="absolute -bottom-[50px] left-1/2 -translate-x-1/2">
            <div className="relative group">
              <div
                className="cursor-pointer"
                onClick={() => !avatarUploading && avatarInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={profile.display_name ?? profile.username}
                    className="w-[100px] h-[100px] rounded-full border-4 border-black object-cover"
                    style={{ boxShadow: "0 0 30px rgba(0,0,0,0.5)" }}
                  />
                ) : (
                  <div
                    className="w-[100px] h-[100px] rounded-full border-4 border-black flex items-center justify-center text-green font-medium"
                    style={{
                      background: "linear-gradient(135deg, var(--surface3), var(--surface2))",
                      fontSize: "2.5rem",
                      boxShadow: "0 0 30px rgba(0,0,0,0.5)",
                    }}
                  >
                    {initials}
                  </div>
                )}

                {avatarUploading && (
                  <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-green border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Avatar edit button */}
              {!avatarUploading && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-[2px] -right-[2px] w-8 h-8 rounded-full bg-green border-[3px] border-black flex items-center justify-center text-black text-base font-semibold hover:opacity-90 transition-opacity"
                >
                  +
                </button>
              )}

              {/* Avatar remove button */}
              {avatarPreview && !avatarUploading && (
                <button
                  onClick={handleAvatarRemove}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-black/80 border border-border flex items-center justify-center text-red text-xs hover:opacity-90 transition-opacity"
                  title="Remove avatar"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Size hints */}
        <p className="text-[.68rem] text-muted2 italic text-center mb-6">
          Avatar: max {MAX_AVATAR_MB} MB · Cover: max {MAX_COVER_MB} MB · JPEG, PNG, or WebP
        </p>

        {/* ── FORM ─────────────────────────────────────── */}
        <div className="mt-2 space-y-6">

          {/* Display name */}
          <div>
            <label className="block text-[.78rem] font-medium tracking-[.02em] text-muted mb-2">
              Display name
            </label>
            <div className="relative">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={100}
                className="w-full bg-surface2 border border-border rounded-card px-4 py-[.95rem] text-[.88rem] text-white font-sans placeholder:text-muted2 placeholder:italic outline-none focus:border-border2 transition-colors"
              />
              {displayName && (
                <button
                  onClick={() => setDisplayName("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-surface3 flex items-center justify-center text-[.85rem] text-muted hover:opacity-70 transition-opacity"
                >
                  ×
                </button>
              )}
            </div>
            <p className="text-[.72rem] text-muted2 italic mt-[.4rem]">
              An optional display name for your profile
            </p>
          </div>

          {/* Username */}
          <div>
            {showUsernameEditor ? (
              <div className="space-y-3">
                <label className="block text-[.78rem] font-medium tracking-[.02em] text-muted mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => handleUsernameInput(e.target.value)}
                  placeholder="New username"
                  maxLength={30}
                  minLength={3}
                  className="w-full bg-surface2 border border-border rounded-card px-4 py-[.95rem] text-[.88rem] text-white font-mono placeholder:text-muted2 outline-none focus:border-border2 transition-colors"
                />
                <div className="min-h-[16px]">
                  {usernameStatus === "checking" && <p className="text-xs text-muted">Checking...</p>}
                  {usernameStatus === "available" && <p className="text-xs text-green">&#10003; Username available</p>}
                  {usernameStatus === "taken" && <p className="text-xs text-red">&#10007; Username already taken</p>}
                  {usernameStatus === "invalid" && newUsername.trim().length > 0 && (
                    <p className="text-xs text-red">3-30 characters, letters, numbers, and underscores only</p>
                  )}
                  {usernameStatus === "same" && <p className="text-xs text-muted2">Current username</p>}
                  {usernameSaveResult?.error && <p className="text-xs text-red">{usernameSaveResult.error}</p>}
                  {usernameSaveResult?.success && <p className="text-xs text-green">Username updated!</p>}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleUsernameSave}
                    disabled={isPending || usernameStatus !== "available" || newUsername.trim() === profile.username}
                    className="flex-1 bg-green text-black rounded-card py-[1rem] text-[.9rem] font-semibold tracking-[.02em] hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isPending ? "Saving..." : "Save username"}
                  </button>
                  <button
                    onClick={() => {
                      setShowUsernameEditor(false);
                      setNewUsername(profile.username);
                      setUsernameStatus("same");
                      setUsernameSaveResult(null);
                    }}
                    className="flex-1 bg-surface2 text-white border border-border2 rounded-card py-[1rem] text-[.9rem] font-semibold tracking-[.02em] hover:opacity-90 transition-opacity"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowUsernameEditor(true)}
                className="w-full bg-green text-black rounded-card py-[1rem] text-[.9rem] font-semibold tracking-[.02em] hover:opacity-90 transition-opacity"
              >
                Change username
              </button>
            )}
          </div>

          {/* Bio */}
          <div>
            {showBioEditor ? (
              <div className="space-y-2">
                <label className="block text-[.78rem] font-medium tracking-[.02em] text-muted mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={300}
                  rows={4}
                  placeholder="Tell us about yourself..."
                  className="w-full bg-surface2 border border-border rounded-card px-4 py-[.95rem] text-[.88rem] leading-relaxed text-white font-sans placeholder:text-muted2 placeholder:italic outline-none focus:border-border2 transition-colors resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[.7rem] text-muted2">{bio.length}/300</span>
                  <button
                    onClick={() => setShowBioEditor(false)}
                    className="text-[.78rem] text-green hover:opacity-80 transition-opacity"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowBioEditor(true)}
                className="w-full bg-surface2 text-white border border-border2 rounded-card py-[1rem] text-[.9rem] font-semibold tracking-[.02em] hover:opacity-90 transition-opacity"
              >
                {bio ? "Edit bio" : "Add a bio"}
              </button>
            )}
          </div>

          {/* Manage sections */}
          <button className="w-full bg-surface2 text-white border border-border2 rounded-card py-[1rem] text-[.9rem] font-semibold tracking-[.02em] hover:opacity-90 transition-opacity">
            Manage sections
          </button>

          {/* Divider */}
          <div className="h-px bg-border my-4" />

          {/* Social links */}
          <div>
            <label className="block text-[.78rem] font-medium tracking-[.02em] text-muted mb-4">
              Social links
            </label>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 bg-surface2 border border-border rounded-card px-4 py-[.85rem]">
                <span className="text-xl w-7 text-center shrink-0 opacity-60">📷</span>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="Instagram handle"
                  maxLength={60}
                  className="flex-1 bg-transparent border-none outline-none text-[.85rem] text-white font-sans placeholder:text-muted2"
                />
                {instagram && (
                  <button onClick={() => setInstagram("")} className="w-5 h-5 rounded-full bg-surface3 flex items-center justify-center text-[.85rem] text-muted hover:opacity-70 transition-opacity shrink-0">×</button>
                )}
              </div>

              <div className="flex items-center gap-3 bg-surface2 border border-border rounded-card px-4 py-[.85rem]">
                <span className="text-xl w-7 text-center shrink-0 opacity-60 font-semibold" style={{ fontFamily: "serif" }}>𝕏</span>
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="X handle"
                  maxLength={60}
                  className="flex-1 bg-transparent border-none outline-none text-[.85rem] text-white font-sans placeholder:text-muted2"
                />
                {twitter && (
                  <button onClick={() => setTwitter("")} className="w-5 h-5 rounded-full bg-surface3 flex items-center justify-center text-[.85rem] text-muted hover:opacity-70 transition-opacity shrink-0">×</button>
                )}
              </div>

              <div className="flex items-center gap-3 bg-surface2 border border-border rounded-card px-4 py-[.85rem]">
                <span className="text-xl w-7 text-center shrink-0 opacity-60">🎵</span>
                <input
                  type="text"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  placeholder="TikTok handle"
                  maxLength={60}
                  className="flex-1 bg-transparent border-none outline-none text-[.85rem] text-white font-sans placeholder:text-muted2"
                />
                {tiktok && (
                  <button onClick={() => setTiktok("")} className="w-5 h-5 rounded-full bg-surface3 flex items-center justify-center text-[.85rem] text-muted hover:opacity-70 transition-opacity shrink-0">×</button>
                )}
              </div>

              <div className="flex items-center gap-3 bg-surface2 border border-border rounded-card px-4 py-[.85rem]">
                <span className="text-xl w-7 text-center shrink-0 opacity-60">▶️</span>
                <input
                  type="text"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="YouTube channel ID"
                  maxLength={100}
                  className="flex-1 bg-transparent border-none outline-none text-[.85rem] text-white font-sans placeholder:text-muted2"
                />
                {youtube && (
                  <button onClick={() => setYoutube("")} className="w-5 h-5 rounded-full bg-surface3 flex items-center justify-center text-[.85rem] text-muted hover:opacity-70 transition-opacity shrink-0">×</button>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
