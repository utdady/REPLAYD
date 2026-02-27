"use server";

import { query } from "@/lib/db";
import { CHIP_TO_CODE, FEED_SEASON_YEAR } from "@/lib/feed-constants";

interface StandingRow {
  team_id: number;
  team_name: string;
  short_name: string | null;
  tla: string | null;
  crest_url: string | null;
  position: number;
  played_games: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  form: string | null;
  [key: string]: unknown;
}

export async function getStandings(competitionCode: string): Promise<StandingRow[]> {
  const code = CHIP_TO_CODE[competitionCode] ?? "";
  if (!code) return [];

  const sql = `
    SELECT
      t.id AS team_id,
      t.name AS team_name,
      t.short_name,
      t.tla,
      t.crest_url,
      st.position,
      st.played_games,
      st.won,
      st.draw,
      st.lost,
      st.points,
      st.goals_for,
      st.goals_against,
      st.goal_difference,
      st.form
    FROM standings st
    JOIN competitions c ON c.id = st.competition_id
    JOIN seasons s ON s.id = st.season_id
    JOIN teams t ON t.id = st.team_id
    WHERE c.code = $1
      AND s.year = $2
    ORDER BY st.position ASC
  `;
  const { rows } = await query<StandingRow>(sql, [code, FEED_SEASON_YEAR]);
  return rows;
}

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
  [key: string]: unknown; // Index signature to satisfy Record<string, unknown>
}

export interface PopularMatchRow {
  id: string;
  competition: string;
  home: { name: string; crest?: string | null };
  away: { name: string; crest?: string | null };
  homeScore: number | null;
  awayScore: number | null;
}

export interface FriendMatchRow extends PopularMatchRow {
  friend: { username: string; avatarUrl?: string | null } | null;
}

/**
 * Fetch matches from the database for a given date and optional competition filter.
 * Filters by the exact date (UTC), not by season year.
 */
export async function getMatchesForFeed(
  dateYmd: string,
  competitionCodeFilter: string,
  year?: number // Year is only used for UI context, not filtering
): Promise<FeedMatchRow[]> {
  const code = CHIP_TO_CODE[competitionCodeFilter] ?? "";

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
      AND ($2 = '' OR c.code = $2)
    ORDER BY m.utc_date ASC
  `;
  const { rows } = await query<FeedMatchRow>(sql, [dateYmd, code]);
  return rows;
}

/** Demo data for the \"Popular this week\" section. Later we can swap this for a real query. */
export async function getPopularMatches(): Promise<PopularMatchRow[]> {
  return [
    {
      id: "p1",
      competition: "EPL",
      home: { name: "Liverpool", crest: "🔴" },
      away: { name: "Man City", crest: "🔵" },
      homeScore: 3,
      awayScore: 2,
    },
    {
      id: "p2",
      competition: "La Liga",
      home: { name: "Barcelona", crest: "🔵" },
      away: { name: "Real Madrid", crest: "⚪" },
      homeScore: 1,
      awayScore: 1,
    },
  ];
}

/** Demo data for the \"New from friends\" section. Later we can swap this for a real query. */
export async function getFriendMatches(): Promise<FriendMatchRow[]> {
  return [
    {
      id: "f1",
      competition: "UCL",
      home: { name: "Inter", crest: "🔵" },
      away: { name: "Atlético", crest: "🔴" },
      homeScore: 2,
      awayScore: 0,
      friend: { username: "footy_fan", avatarUrl: null },
    },
  ];
}
