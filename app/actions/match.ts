"use server";

import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";

export interface MatchByIdRow {
  id: number;
  utc_date: string;
  status: string;
  matchday: number | null;
  stage: string | null;
  home_score: number | null;
  away_score: number | null;
  venue: string | null;
  referee_name: string | null;
  competition_name: string;
  competition_code: string;
  emblem_url: string | null;
  season_year: number | null;
  home_team_id: number;
  home_team_name: string;
  home_crest_url: string | null;
  away_team_id: number;
  away_team_name: string;
  away_crest_url: string | null;
  [key: string]: unknown;
}

export interface MatchGoalRow {
  minute: number | null;
  injury_time: number | null;
  type: string;
  team_id: number;
  scorer_name: string;
  assist_name: string | null;
  score_home: number;
  score_away: number;
}

export interface MatchLineupPlayer {
  id: number;
  name: string;
  position: string | null;
  shirtNumber: number | null;
}

export interface MatchTeamDetailRow {
  side: "home" | "away";
  team_id: number;
  formation: string | null;
  coach_name: string | null;
  lineup: MatchLineupPlayer[];
  bench: MatchLineupPlayer[];
}

export async function getMatchById(id: string): Promise<MatchByIdRow | null> {
  const matchId = parseInt(id, 10);
  if (Number.isNaN(matchId)) return null;

  const sql = `
    SELECT
      m.id,
      m.utc_date::text AS utc_date,
      m.status,
      m.matchday,
      m.stage,
      m.home_score,
      m.away_score,
      m.venue,
      m.referee_name,
      c.name AS competition_name,
      c.code AS competition_code,
      c.emblem_url,
      s.year AS season_year,
      ht.id AS home_team_id,
      ht.name AS home_team_name,
      ht.crest_url AS home_crest_url,
      at.id AS away_team_id,
      at.name AS away_team_name,
      at.crest_url AS away_crest_url
    FROM matches m
    JOIN competitions c ON c.id = m.competition_id
    LEFT JOIN seasons s ON s.id = m.season_id
    JOIN teams ht ON ht.id = m.home_team_id
    JOIN teams at ON at.id = m.away_team_id
    WHERE m.id = $1
  `;
  const { rows } = await query<MatchByIdRow>(sql, [matchId]);
  return rows[0] ?? null;
}

export async function getMatchGoals(matchId: string): Promise<MatchGoalRow[]> {
  const id = parseInt(matchId, 10);
  if (Number.isNaN(id)) return [];
  const { rows } = await query<MatchGoalRow>(
    `SELECT minute, injury_time, type, team_id, scorer_name, assist_name, score_home, score_away
     FROM match_goals WHERE match_id = $1 ORDER BY sort_order ASC`,
    [id]
  );
  return rows;
}

export async function getMatchLineups(matchId: string): Promise<{
  home: MatchTeamDetailRow | null;
  away: MatchTeamDetailRow | null;
}> {
  const id = parseInt(matchId, 10);
  if (Number.isNaN(id)) return { home: null, away: null };
  const { rows } = await query<{
    side: string;
    team_id: number;
    formation: string | null;
    coach_name: string | null;
    lineup: unknown;
    bench: unknown;
  }>(
    `SELECT side, team_id, formation, coach_name, lineup, bench
     FROM match_team_details WHERE match_id = $1`,
    [id]
  );
  const parsePlayers = (raw: unknown): MatchLineupPlayer[] => {
    if (Array.isArray(raw)) {
      return raw.map((p: { id?: number; name?: string; position?: string | null; shirtNumber?: number | null }) => ({
        id: p.id ?? 0,
        name: p.name ?? "",
        position: p.position ?? null,
        shirtNumber: p.shirtNumber ?? null,
      }));
    }
    return [];
  };
  let home: MatchTeamDetailRow | null = null;
  let away: MatchTeamDetailRow | null = null;
  for (const r of rows) {
    const row: MatchTeamDetailRow = {
      side: r.side as "home" | "away",
      team_id: r.team_id,
      formation: r.formation,
      coach_name: r.coach_name,
      lineup: parsePlayers(r.lineup),
      bench: parsePlayers(r.bench),
    };
    if (r.side === "home") home = row;
    else away = row;
  }
  return { home, away };
}

export interface LogForMatchRow {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  rating: number | null;
  review: string | null;
  created_at: string;
  like_count: number;
  [key: string]: unknown;
}

export type LogsSortBy = "likes" | "recency";

export interface GetLogsForMatchOptions {
  sortBy?: LogsSortBy;
  filterByFriends?: boolean;
  currentUserId?: string | null;
}

export async function getLogsForMatch(
  matchId: string,
  options?: GetLogsForMatchOptions
): Promise<LogForMatchRow[]> {
  const mid = parseInt(matchId, 10);
  if (Number.isNaN(mid)) return [];

  const sortBy = options?.sortBy ?? "likes";
  const filterByFriends = options?.filterByFriends ?? false;
  const currentUserId = options?.currentUserId ?? null;

  const orderClause =
    sortBy === "likes"
      ? "ORDER BY COALESCE(lc.cnt, 0) DESC, ml.created_at DESC"
      : "ORDER BY ml.created_at DESC";

  const sql = `
    WITH like_counts AS (
      SELECT log_id, COUNT(*)::int AS cnt
      FROM log_likes
      GROUP BY log_id
    )
    SELECT
      ml.id::text,
      ml.user_id::text,
      p.username,
      p.avatar_url,
      ml.rating::float,
      ml.review,
      ml.created_at::text,
      COALESCE(lc.cnt, 0)::int AS like_count
    FROM match_logs ml
    JOIN profiles p ON p.id = ml.user_id
    LEFT JOIN like_counts lc ON lc.log_id = ml.id
    WHERE ml.match_id = $1
      AND (
        NOT $3::boolean
        OR EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = $2 AND f.following_id = ml.user_id)
      )
    ${orderClause}
  `;
  try {
    const { rows } = await query<LogForMatchRow & { like_count: number }>(sql, [
      mid,
      currentUserId ?? null,
      filterByFriends && currentUserId != null,
    ]);
    return rows.map((r) => ({ ...r, like_count: r.like_count ?? 0 }));
  } catch {
    const fallbackSql = `
      SELECT
        ml.id::text,
        ml.user_id::text,
        p.username,
        p.avatar_url,
        ml.rating::float,
        ml.review,
        ml.created_at::text
      FROM match_logs ml
      JOIN profiles p ON p.id = ml.user_id
      WHERE ml.match_id = $1
        AND (
          NOT $3::boolean
          OR EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = $2 AND f.following_id = ml.user_id)
        )
      ORDER BY ml.created_at DESC
    `;
    const { rows } = await query<LogForMatchRow & { like_count?: number }>(fallbackSql, [
      mid,
      currentUserId ?? null,
      filterByFriends && currentUserId != null,
    ]);
    return rows.map((r) => ({ ...r, like_count: r.like_count ?? 0 }));
  }
}

export interface MatchRatingStats {
  distribution: Record<number, number>;
  average: number | null;
  totalCount: number;
}

export async function getMatchRatingStats(matchId: string): Promise<MatchRatingStats> {
  const mid = parseInt(matchId, 10);
  if (Number.isNaN(mid)) return { distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, average: null, totalCount: 0 };

  const sql = `
    SELECT
      rating::float AS rating,
      COUNT(*)::int AS count
    FROM match_logs
    WHERE match_id = $1 AND rating IS NOT NULL
    GROUP BY rating
  `;
  const { rows } = await query<{ rating: number; count: number; [key: string]: unknown }>(sql, [mid]);

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalCount = 0;
  let sum = 0;

  for (const row of rows) {
    const star = Math.round(row.rating);
    if (star >= 1 && star <= 5) {
      distribution[star] = (distribution[star] ?? 0) + row.count;
      totalCount += row.count;
      sum += row.rating * row.count;
    }
  }

  const average = totalCount > 0 ? Math.round((sum / totalCount) * 10) / 10 : null;
  return { distribution, average, totalCount };
}

export type CreateMatchLogInput = {
  rating?: number | null;
  review?: string | null;
  watched_date?: string | null;
  is_rewatch?: boolean;
  contains_spoilers?: boolean;
};

export async function createMatchLog(
  matchId: number,
  input: CreateMatchLogInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in to log a match." };

  if (typeof matchId !== "number" || !Number.isInteger(matchId) || matchId < 1 || matchId > 2_147_483_647) {
    return { ok: false, error: "Invalid match." };
  }

  const { rating, review, watched_date, is_rewatch = false, contains_spoilers = false } = input;

  if (rating != null) {
    const r = Number(rating);
    if (Number.isNaN(r) || r < 0.5 || r > 5 || Math.round(r * 2) !== r * 2) {
      return { ok: false, error: "Rating must be between 0.5 and 5 (half-star steps)." };
    }
  }

  let watchedDateValue: string | null = null;
  if (watched_date != null && watched_date !== "") {
    const trimmed = String(watched_date).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return { ok: false, error: "Invalid date format." };
    }
    const d = new Date(trimmed);
    if (Number.isNaN(d.getTime())) return { ok: false, error: "Invalid date." };
    const minDate = new Date("2000-01-01");
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    if (d < minDate || d > maxDate) {
      return { ok: false, error: "Date must be between 2000 and next year." };
    }
    watchedDateValue = trimmed;
  }

  const reviewTrimmed = (review ?? "").slice(0, 180) || null;

  const RATE_WINDOW_MINUTES = 5;
  const RATE_MAX_LOGS = 20;
  const { rows: recentCount } = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM match_logs
     WHERE user_id = $1 AND created_at > NOW() - INTERVAL '5 minutes'`,
    [user.id]
  );
  if ((recentCount[0]?.count ?? 0) >= RATE_MAX_LOGS) {
    return { ok: false, error: "Too many logs. Please try again in a few minutes." };
  }

  const sql = `
    INSERT INTO match_logs (user_id, match_id, rating, review, watched_date, is_rewatch, contains_spoilers)
    VALUES ($1, $2, $3, $4, $5::date, $6, $7)
    ON CONFLICT (user_id, match_id) DO UPDATE SET
      rating = EXCLUDED.rating,
      review = EXCLUDED.review,
      watched_date = EXCLUDED.watched_date,
      is_rewatch = EXCLUDED.is_rewatch,
      contains_spoilers = EXCLUDED.contains_spoilers,
      updated_at = NOW()
  `;
  try {
    await query(sql, [
      user.id,
      matchId,
      rating ?? null,
      reviewTrimmed,
      watchedDateValue,
      is_rewatch,
      contains_spoilers,
    ]);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save log";
    return { ok: false, error: message };
  }
}

/** UUID v4 pattern for log_id */
const LOG_ID_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function toggleLogLike(logId: string): Promise<{ ok: true; liked: boolean } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in to like." };

  if (!logId || !LOG_ID_UUID_REGEX.test(logId)) {
    return { ok: false, error: "Invalid log." };
  }

  const RATE_WINDOW_MINUTES = 5;
  const RATE_MAX_LIKES = 60;
  const { rows: recentLikes } = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM log_likes
     WHERE user_id = $1 AND created_at > NOW() - INTERVAL '5 minutes'`,
    [user.id]
  );
  if ((recentLikes[0]?.count ?? 0) >= RATE_MAX_LIKES) {
    return { ok: false, error: "Too many actions. Please try again in a few minutes." };
  }

  const checkSql = "SELECT 1 FROM log_likes WHERE user_id = $1 AND log_id = $2";
  const { rows: existing } = await query<Record<string, unknown>>(checkSql, [user.id, logId]);
  const alreadyLiked = existing.length > 0;

  if (alreadyLiked) {
    await query("DELETE FROM log_likes WHERE user_id = $1 AND log_id = $2", [user.id, logId]);
    return { ok: true, liked: false };
  } else {
    await query("INSERT INTO log_likes (user_id, log_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [user.id, logId]);
    return { ok: true, liked: true };
  }
}
