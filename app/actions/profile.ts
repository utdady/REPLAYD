"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { isFollowTheGoatOn, DEV_USERNAME } from "@/lib/follow-the-goat";

interface ProfileRow {
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
  [key: string]: unknown;
}

interface ProfileStats {
  matches_logged: number;
  avg_rating: number | null;
  lists_count: number;
  [key: string]: unknown;
}

export async function getMyProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("getMyProfile auth error:", authError?.message ?? "no user");
    return null;
  }

  const { rows } = await query<ProfileRow>(
    "SELECT id::text, username, display_name, bio, avatar_url, cover_url, created_at::text, instagram, twitter, tiktok, youtube FROM profiles WHERE id = $1",
    [user.id]
  );

  // If no profile row exists (e.g. trigger failed or old account), create one
  if (rows.length === 0) {
    const email = user.email ?? "";
    const meta = user.user_metadata ?? {};
    const baseName = (
      meta.username ??
      (meta.name ? String(meta.name).replace(/\s+/g, "").toLowerCase() : null) ??
      (meta.full_name ? String(meta.full_name).replace(/\s+/g, "").toLowerCase() : null) ??
      email.split("@")[0] ??
      "user"
    ).replace(/[^a-zA-Z0-9_]/g, "_").substring(0, 30).toLowerCase();

    let finalName = baseName || "user";
    let suffix = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { rows: existing } = await query<{ count: number }>(
        "SELECT COUNT(*)::int as count FROM profiles WHERE username = $1",
        [finalName]
      );
      if (existing[0]?.count === 0) break;
      suffix++;
      finalName = `${baseName}_${suffix}`;
    }

    await query(
      "INSERT INTO profiles (id, username, display_name, avatar_url) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING",
      [user.id, finalName, meta.full_name ?? meta.name ?? null, meta.avatar_url ?? null]
    );

    // FOLLOW THE GOAT: auto-follow dev account for new users when feature is on
    if (isFollowTheGoatOn()) {
      const { rows: devRows } = await query<{ id: string }>(
        "SELECT id FROM profiles WHERE LOWER(username) = LOWER($1) AND id != $2",
        [DEV_USERNAME, user.id]
      );
      if (devRows.length > 0) {
        await query(
          "INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [user.id, devRows[0].id]
        );
      }
    }

    return {
      id: user.id,
      username: finalName,
      display_name: meta.full_name ?? meta.name ?? null,
      bio: null,
      avatar_url: meta.avatar_url ?? null,
      cover_url: null,
      created_at: new Date().toISOString(),
      instagram: null,
      twitter: null,
      tiktok: null,
      youtube: null,
    };
  }

  return rows[0];
}

export async function updateUsername(newUsername: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const trimmed = newUsername.trim().toLowerCase();

  if (!/^[a-zA-Z0-9_]{3,30}$/.test(trimmed)) {
    return { success: false, error: "Username must be 3-30 characters: letters, numbers, and underscores only" };
  }

  // Check availability
  const { rows: existing } = await query<{ id: string }>(
    "SELECT id FROM profiles WHERE LOWER(username) = $1 AND id != $2",
    [trimmed, user.id]
  );
  if (existing.length > 0) {
    return { success: false, error: "Username is already taken" };
  }

  // Update
  const { rows: updated } = await query<ProfileRow>(
    "UPDATE profiles SET username = $1 WHERE id = $2 RETURNING username",
    [trimmed, user.id]
  );

  if (updated.length === 0) {
    return { success: false, error: "Failed to update username" };
  }

  revalidatePath("/profile");
  revalidatePath(`/users/${trimmed}`);
  return { success: true };
}

export async function getProfileStats(): Promise<ProfileStats> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { matches_logged: 0, avg_rating: null, lists_count: 0 };

  const { rows: logStats } = await query<{ count: number; avg: number | null }>(
    "SELECT COUNT(*)::int as count, ROUND(AVG(rating)::numeric, 1)::float as avg FROM match_logs WHERE user_id = $1",
    [user.id]
  );
  const { rows: listStats } = await query<{ count: number }>(
    "SELECT COUNT(*)::int as count FROM lists WHERE user_id = $1",
    [user.id]
  );

  return {
    matches_logged: logStats[0]?.count ?? 0,
    avg_rating: logStats[0]?.avg ?? null,
    lists_count: listStats[0]?.count ?? 0,
  };
}

export async function updateBio(newBio: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const trimmed = newBio.trim().substring(0, 300);
  await query("UPDATE profiles SET bio = $1 WHERE id = $2", [trimmed || null, user.id]);

  revalidatePath("/profile");
  return { success: true };
}

interface ProfileUpdateData {
  display_name?: string;
  bio?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
}

export async function updateProfile(data: ProfileUpdateData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const displayName = (data.display_name ?? "").trim().substring(0, 100) || null;
  const bio = (data.bio ?? "").trim().substring(0, 300) || null;
  const instagram = (data.instagram ?? "").trim().replace(/^@/, "").substring(0, 60) || null;
  const twitter = (data.twitter ?? "").trim().replace(/^@/, "").substring(0, 60) || null;
  const tiktok = (data.tiktok ?? "").trim().replace(/^@/, "").substring(0, 60) || null;
  const youtube = (data.youtube ?? "").trim().substring(0, 100) || null;

  await query(
    `UPDATE profiles
     SET display_name = $1, bio = $2, instagram = $3, twitter = $4, tiktok = $5, youtube = $6, updated_at = NOW()
     WHERE id = $7`,
    [displayName, bio, instagram, twitter, tiktok, youtube, user.id]
  );

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return { success: true };
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;  // 2 MB
const MAX_COVER_BYTES = 4 * 1024 * 1024;   // 4 MB

function validateImageFile(
  file: File,
  maxBytes: number,
  label: string
): string | null {
  if (!file || file.size === 0) return `No ${label} file provided`;
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `${label} must be JPEG, PNG, or WebP`;
  }
  if (file.size > maxBytes) {
    return `${label} must be under ${Math.round(maxBytes / 1024 / 1024)} MB (yours is ${(file.size / 1024 / 1024).toFixed(1)} MB)`;
  }
  return null;
}

export async function uploadAvatar(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "No file provided" };

  const validationError = validateImageFile(file, MAX_AVATAR_BYTES, "Avatar");
  if (validationError) return { success: false, error: validationError };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `avatars/${user.id}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-images")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { success: false, error: uploadError.message };

  const { data: urlData } = supabase.storage
    .from("profile-images")
    .getPublicUrl(path);

  const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  await query("UPDATE profiles SET avatar_url = $1, updated_at = NOW() WHERE id = $2", [publicUrl, user.id]);

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return { success: true, url: publicUrl };
}

export async function uploadCover(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "No file provided" };

  const validationError = validateImageFile(file, MAX_COVER_BYTES, "Cover photo");
  if (validationError) return { success: false, error: validationError };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `covers/${user.id}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-images")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { success: false, error: uploadError.message };

  const { data: urlData } = supabase.storage
    .from("profile-images")
    .getPublicUrl(path);

  const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  await query("UPDATE profiles SET cover_url = $1, updated_at = NOW() WHERE id = $2", [publicUrl, user.id]);

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return { success: true, url: publicUrl };
}

export async function removeAvatar(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  await supabase.storage.from("profile-images").remove([
    `avatars/${user.id}.jpg`, `avatars/${user.id}.png`, `avatars/${user.id}.webp`,
  ]);
  await query("UPDATE profiles SET avatar_url = NULL, updated_at = NOW() WHERE id = $1", [user.id]);

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return { success: true };
}

export async function removeCover(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  await supabase.storage.from("profile-images").remove([
    `covers/${user.id}.jpg`, `covers/${user.id}.png`, `covers/${user.id}.webp`,
  ]);
  await query("UPDATE profiles SET cover_url = NULL, updated_at = NOW() WHERE id = $1", [user.id]);

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return { success: true };
}
