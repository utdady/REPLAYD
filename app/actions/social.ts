"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { isFollowTheGoatOn, isDevUsername } from "@/lib/follow-the-goat";

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

  // FOLLOW THE GOAT: do not allow unfollowing the dev when feature is on
  if (isFollowTheGoatOn()) {
    const { rows: targetRows } = await query<{ username: string }>(
      "SELECT username FROM profiles WHERE id = $1",
      [targetId]
    );
    if (targetRows.length > 0 && isDevUsername(targetRows[0].username)) {
      return { success: false, error: "You cannot unfollow this account." };
    }
  }

  await query(
    "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
    [user.id, targetId]
  );

  revalidatePath("/profile");
  revalidatePath("/search");
  return { success: true };
}

interface FollowListUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  [key: string]: unknown;
}

export async function getFollowersList(userId: string): Promise<FollowListUser[]> {
  const { rows } = await query<FollowListUser>(
    `SELECT p.id::text, p.username, p.display_name, p.avatar_url
     FROM follows f
     JOIN profiles p ON p.id = f.follower_id
     WHERE f.following_id = $1
     ORDER BY f.created_at DESC
     LIMIT 200`,
    [userId]
  );
  return rows;
}

export async function getFollowingList(userId: string): Promise<FollowListUser[]> {
  const { rows } = await query<FollowListUser>(
    `SELECT p.id::text, p.username, p.display_name, p.avatar_url
     FROM follows f
     JOIN profiles p ON p.id = f.following_id
     WHERE f.follower_id = $1
     ORDER BY f.created_at DESC
     LIMIT 200`,
    [userId]
  );
  return rows;
}

export async function getUserProfile(username: string) {
  const { rows } = await query<{
    id: string; username: string; display_name: string | null;
    bio: string | null; avatar_url: string | null; cover_url: string | null;
    created_at: string | null; instagram: string | null; twitter: string | null;
    tiktok: string | null; youtube: string | null;
    [key: string]: unknown;
  }>(
    "SELECT id::text, username, display_name, bio, avatar_url, cover_url, created_at::text, instagram, twitter, tiktok, youtube FROM profiles WHERE LOWER(username) = LOWER($1)",
    [username.trim().substring(0, 30)]
  );
  return rows[0] ?? null;
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
