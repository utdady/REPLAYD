"use server";

import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";

const LOG_ID_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_COMMENT_BODY = 500;
const FEED_PAGE_SIZE = 20;

export type CommunityTab = "feed" | "friends";
export type CommunitySort = "newest" | "trending";

export interface CommunityFeedItem {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  match_id: number;
  match_title: string;
  competition_name: string;
  home_score: number | null;
  away_score: number | null;
  rating: number | null;
  review: string | null;
  created_at: string;
  like_count: number;
  comment_count: number;
  current_user_liked: boolean;
  [key: string]: unknown;
}

export interface GetCommunityFeedOptions {
  tab: CommunityTab;
  sort: CommunitySort;
  currentUserId: string | null;
  limit?: number;
}

export async function getCommunityFeed(
  options: GetCommunityFeedOptions
): Promise<CommunityFeedItem[]> {
  const { tab, sort, currentUserId, limit = FEED_PAGE_SIZE } = options;

  const likeCounts = `
    SELECT log_id, COUNT(*)::int AS cnt
    FROM log_likes
    GROUP BY log_id
  `;
  const commentCounts = `
    SELECT log_id, COUNT(*)::int AS cnt
    FROM log_comments
    GROUP BY log_id
  `;

  const orderClause =
    sort === "trending"
      ? "ORDER BY COALESCE(lc.cnt, 0) DESC, ml.created_at DESC"
      : "ORDER BY ml.created_at DESC";

  if (tab === "friends" && currentUserId) {
    const sql = `
      WITH like_ct AS (${likeCounts}),
           comment_ct AS (${commentCounts})
      SELECT
        ml.id::text,
        ml.user_id::text,
        p.username,
        p.avatar_url,
        ml.match_id,
        (ht.name || ' v ' || at.name) AS match_title,
        c.name AS competition_name,
        m.home_score,
        m.away_score,
        ml.rating::float,
        ml.review,
        ml.created_at::text,
        COALESCE(lc.cnt, 0)::int AS like_count,
        COALESCE(cc.cnt, 0)::int AS comment_count,
        (EXISTS (SELECT 1 FROM log_likes ll WHERE ll.log_id = ml.id AND ll.user_id = $1)) AS current_user_liked
      FROM match_logs ml
      JOIN profiles p ON p.id = ml.user_id
      JOIN matches m ON m.id = ml.match_id
      JOIN competitions c ON c.id = m.competition_id
      JOIN teams ht ON ht.id = m.home_team_id
      JOIN teams at ON at.id = m.away_team_id
      LEFT JOIN like_ct lc ON lc.log_id = ml.id
      LEFT JOIN comment_ct cc ON cc.log_id = ml.id
      WHERE EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = $1 AND f.following_id = ml.user_id)
      ${orderClause}
      LIMIT $2
    `;
    try {
      const { rows } = await query<CommunityFeedItem & { current_user_liked: boolean }>(sql, [
        currentUserId,
        limit,
      ]);
      return rows.map((r) => ({ ...r, current_user_liked: r.current_user_liked ?? false }));
    } catch {
      return [];
    }
  }

  const likedSub = currentUserId
    ? "EXISTS (SELECT 1 FROM log_likes ll WHERE ll.log_id = ml.id AND ll.user_id = $1)"
    : "false";
  const limitParam = currentUserId ? "$2" : "$1";

  const sql = `
    WITH like_ct AS (${likeCounts}),
         comment_ct AS (${commentCounts})
    SELECT
      ml.id::text,
      ml.user_id::text,
      p.username,
      p.avatar_url,
      ml.match_id,
      (ht.name || ' v ' || at.name) AS match_title,
      c.name AS competition_name,
      m.home_score,
      m.away_score,
      ml.rating::float,
      ml.review,
      ml.created_at::text,
      COALESCE(lc.cnt, 0)::int AS like_count,
      COALESCE(cc.cnt, 0)::int AS comment_count,
      (${likedSub}) AS current_user_liked
    FROM match_logs ml
    JOIN profiles p ON p.id = ml.user_id
    JOIN matches m ON m.id = ml.match_id
    JOIN competitions c ON c.id = m.competition_id
    JOIN teams ht ON ht.id = m.home_team_id
    JOIN teams at ON at.id = m.away_team_id
    LEFT JOIN like_ct lc ON lc.log_id = ml.id
    LEFT JOIN comment_ct cc ON cc.log_id = ml.id
    WHERE 1=1
    ${orderClause}
    LIMIT ${limitParam}
  `;

  try {
    const { rows } = await query<CommunityFeedItem & { current_user_liked: boolean }>(
      sql,
      currentUserId ? [currentUserId, limit] : [limit]
    );
    return rows.map((r) => ({ ...r, current_user_liked: r.current_user_liked ?? false }));
  } catch {
    return [];
  }
}

export interface LogCommentRow {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  body: string;
  created_at: string;
  [key: string]: unknown;
}

export async function getLogComments(logId: string): Promise<LogCommentRow[]> {
  if (!logId || !LOG_ID_UUID_REGEX.test(logId)) return [];

  const sql = `
    SELECT
      lc.id::text,
      lc.user_id::text,
      p.username,
      p.avatar_url,
      lc.body,
      lc.created_at::text
    FROM log_comments lc
    JOIN profiles p ON p.id = lc.user_id
    WHERE lc.log_id = $1
    ORDER BY lc.created_at ASC
  `;
  const { rows } = await query<LogCommentRow>(sql, [logId]);
  return rows;
}

export async function createLogComment(
  logId: string,
  body: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in to comment." };

  if (!logId || !LOG_ID_UUID_REGEX.test(logId)) {
    return { ok: false, error: "Invalid post." };
  }

  const trimmed = (body ?? "").trim();
  if (!trimmed) return { ok: false, error: "Comment cannot be empty." };
  const bodyFinal = trimmed.length > MAX_COMMENT_BODY ? trimmed.slice(0, MAX_COMMENT_BODY) : trimmed;

  const sql = `
    INSERT INTO log_comments (log_id, user_id, body)
    VALUES ($1, $2, $3)
  `;
  try {
    await query(sql, [logId, user.id, bodyFinal]);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to post comment";
    return { ok: false, error: message };
  }
}
