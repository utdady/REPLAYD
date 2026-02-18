"use server";

import { query } from "@/lib/db";
import { CHIP_TO_CODE, FEED_SEASON_YEAR } from "@/lib/feed-constants";

interface FeedMatchRow {
  id: number;
  utc_date: string;
  competition_code: string;
  competition_name: string;
  season_year: number;
  home_team_id: number;
  home_team_name: string;
  home_crest_url: string | null;
  away_team_id: number;
  away_team_name: string;
  away_crest_url: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
}

/**
 * Fetch matches from the database for a given date and optional competition filter.
 * Only returns matches from the 2024/25 season (FEED_SEASON_YEAR).
 */
export async function getMatchesForFeed(
  dateYmd: string,
  competitionCodeFilter: string
): Promise<FeedMatchRow[]> {
  const code = CHIP_TO_CODE[competitionCodeFilter] ?? "";
  const seasonYear = FEED_SEASON_YEAR;

  const sql = `
    SELECT
      m.id,
      m.utc_date::text AS utc_date,
      c.code AS competition_code,
      c.name AS competition_name,
      s.year AS season_year,
      ht.id AS home_team_id,
      ht.name AS home_team_name,
      ht.crest_url AS home_crest_url,
      at.id AS away_team_id,
      at.name AS away_team_name,
      at.crest_url AS away_crest_url,
      m.home_score,
      m.away_score,
      m.status
    FROM matches m
    JOIN competitions c ON c.id = m.competition_id
    JOIN seasons s ON s.id = m.season_id
    JOIN teams ht ON ht.id = m.home_team_id
    JOIN teams at ON at.id = m.away_team_id
    WHERE (m.utc_date AT TIME ZONE 'UTC')::date = $1::date
      AND s.year = $2
      AND ($3 = '' OR c.code = $3)
    ORDER BY m.utc_date ASC
  `;
  const { rows } = await query<FeedMatchRow>(sql, [dateYmd, seasonYear, code]);
  return rows;
}
