"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";

interface ProfileRow {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string | null;
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
    "SELECT id::text, username, display_name, bio, avatar_url, created_at::text FROM profiles WHERE id = $1",
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

    return {
      id: user.id,
      username: finalName,
      display_name: meta.full_name ?? meta.name ?? null,
      bio: null,
      avatar_url: meta.avatar_url ?? null,
      created_at: new Date().toISOString(),
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
