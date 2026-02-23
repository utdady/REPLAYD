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

export interface LogForMatchRow {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  rating: number | null;
  review: string | null;
  created_at: string;
  [key: string]: unknown;
}

export async function getLogsForMatch(matchId: string): Promise<LogForMatchRow[]> {
  const mid = parseInt(matchId, 10);
  if (Number.isNaN(mid)) return [];

  const sql = `
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
    ORDER BY ml.created_at DESC
  `;
  const { rows } = await query<LogForMatchRow>(sql, [mid]);
  return rows;
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

  const { rating, review, watched_date, is_rewatch = false, contains_spoilers = false } = input;

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
      review ?? null,
      watched_date ?? null,
      is_rewatch,
      contains_spoilers,
    ]);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save log";
    return { ok: false, error: message };
  }
}
