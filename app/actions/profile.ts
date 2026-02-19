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
  [key: string]: unknown;
}

export async function getMyProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { rows } = await query<ProfileRow>(
    "SELECT id, username, display_name, bio, avatar_url FROM profiles WHERE id = $1",
    [user.id]
  );
  return rows[0] ?? null;
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
