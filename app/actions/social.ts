"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";

interface UserSearchResult {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_following: boolean;
  [key: string]: unknown;
}

export async function searchUsers(searchQuery: string): Promise<UserSearchResult[]> {
  const trimmed = searchQuery.trim().substring(0, 100);
  if (!trimmed || trimmed.length < 2) return [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  const pattern = `%${trimmed}%`;

  if (currentUserId) {
    const { rows } = await query<UserSearchResult>(
      `SELECT
        p.id::text,
        p.username,
        p.display_name,
        p.avatar_url,
        CASE WHEN f.follower_id IS NOT NULL THEN true ELSE false END AS is_following
      FROM profiles p
      LEFT JOIN follows f ON f.following_id = p.id AND f.follower_id = $3
      WHERE p.id != $3
        AND (p.username ILIKE $1 OR p.display_name ILIKE $1)
      ORDER BY
        CASE WHEN LOWER(p.username) = LOWER($2) THEN 0 ELSE 1 END,
        p.username
      LIMIT 20`,
      [pattern, trimmed, currentUserId]
    );
    return rows;
  }

  const { rows } = await query<UserSearchResult>(
    `SELECT
      p.id::text,
      p.username,
      p.display_name,
      p.avatar_url,
      false AS is_following
    FROM profiles p
    WHERE p.username ILIKE $1 OR p.display_name ILIKE $1
    ORDER BY
      CASE WHEN LOWER(p.username) = LOWER($2) THEN 0 ELSE 1 END,
      p.username
    LIMIT 20`,
    [pattern, trimmed]
  );
  return rows;
}

export async function followUser(targetId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };
  if (user.id === targetId) return { success: false, error: "Cannot follow yourself" };

  const { rows: targetExists } = await query<{ id: string }>(
    "SELECT id FROM profiles WHERE id = $1",
    [targetId]
  );
  if (targetExists.length === 0) return { success: false, error: "User not found" };

  await query(
    "INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [user.id, targetId]
  );

  revalidatePath("/profile");
  revalidatePath("/search");
  return { success: true };
}

export async function unfollowUser(targetId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  await query(
    "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
    [user.id, targetId]
  );

  revalidatePath("/profile");
  revalidatePath("/search");
  return { success: true };
}

export async function getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
  const { rows: followerRows } = await query<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM follows WHERE following_id = $1",
    [userId]
  );
  const { rows: followingRows } = await query<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM follows WHERE follower_id = $1",
    [userId]
  );

  return {
    followers: followerRows[0]?.count ?? 0,
    following: followingRows[0]?.count ?? 0,
  };
}
