"use server";

import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { getWatchedListIdForUser } from "@/app/actions/list";

export interface TeamRow {
  id: number;
  name: string;
  short_name: string | null;
  tla: string | null;
  crest_url: string | null;
  [key: string]: unknown;
}

export async function getTeamById(identifier: string): Promise<TeamRow | null> {
  const id = parseInt(identifier, 10);
  if (!Number.isNaN(id)) {
    const { rows } = await query<TeamRow>(
      `SELECT id, name, short_name, tla, crest_url FROM teams WHERE id = $1`,
      [id]
    );
    if (rows[0]) return rows[0];
  }

  // Fallback: treat identifier as slugified team name, e.g. "borussia-dortmund"
  const { rows } = await query<TeamRow>(
    `SELECT id, name, short_name, tla, crest_url
     FROM teams
     WHERE regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g') = $1
     LIMIT 1`,
    [identifier.toLowerCase()]
  );
  return rows[0] ?? null;
}

export async function getTeamSeasons(teamId: number): Promise<number[]> {
  const { rows } = await query<{ year: number }>(
    `SELECT DISTINCT s.year
     FROM matches m
     JOIN seasons s ON s.id = m.season_id
     WHERE (m.home_team_id = $1 OR m.away_team_id = $1)
     ORDER BY s.year DESC`,
    [teamId]
  );
  return rows.map((r) => r.year);
}

export async function isTeamFavorited(teamId: number): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { rows } = await query<{ n: number }>(
    `SELECT 1 AS n FROM favorite_teams WHERE user_id = $1 AND team_id = $2 LIMIT 1`,
    [user.id, teamId]
  );
  return rows.length > 0;
}

export async function toggleFavoriteTeam(
  teamId: number
): Promise<{ ok: true; favorited: boolean } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to favorite teams." };
  const { rows: existing } = await query<{ n: number }>(
    `SELECT 1 AS n FROM favorite_teams WHERE user_id = $1 AND team_id = $2 LIMIT 1`,
    [user.id, teamId]
  );
  try {
    if (existing.length > 0) {
      await query(`DELETE FROM favorite_teams WHERE user_id = $1 AND team_id = $2`, [user.id, teamId]);
      return { ok: true, favorited: false };
    }
    await query(
      `INSERT INTO favorite_teams (user_id, team_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [user.id, teamId]
    );
    return { ok: true, favorited: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update favorite";
    return { ok: false, error: message };
  }
}

export interface TeamNextMatchRow {
  id: number;
  utc_date: string;
  competition_code: string;
  competition_name: string;
  home_team_id: number;
  home_team_name: string;
  home_crest_url: string | null;
  away_team_id: number;
  away_team_name: string;
  away_crest_url: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
  [key: string]: unknown;
}

export interface TeamFormMatchRow {
  match_id: number;
  utc_date: string;
  result: "W" | "D" | "L";
  home_team_id: number;
  away_team_id: number;
  home_score: number | null;
  away_score: number | null;
  opponent_crest_url: string | null;
  [key: string]: unknown;
}

export interface TeamOverviewResult {
  nextMatch: TeamNextMatchRow | null;
  form: TeamFormMatchRow[];
  mostWatchedMatch: TeamNextMatchRow | null;
  highestRatedMatch: TeamNextMatchRow | null;
}

export async function getTeamOverview(
  teamId: number,
  seasonYear: number
): Promise<TeamOverviewResult> {
  const baseMatchSelect = `
    m.id, m.utc_date::text AS utc_date, m.status, m.home_score, m.away_score,
    c.code AS competition_code, c.name AS competition_name,
    ht.id AS home_team_id, ht.name AS home_team_name, ht.crest_url AS home_crest_url,
    at.id AS away_team_id, at.name AS away_team_name, at.crest_url AS away_crest_url
  `;
  const teamMatchWhere = `(m.home_team_id = $1 OR m.away_team_id = $1) AND s.year = $2`;
  const joinClause = `
    FROM matches m
    JOIN competitions c ON c.id = m.competition_id
    JOIN seasons s ON s.id = m.season_id
    JOIN teams ht ON ht.id = m.home_team_id
    JOIN teams at ON at.id = m.away_team_id
  `;

  const [nextRes, formRes, watchedRes, ratedRes] = await Promise.all([
    query<TeamNextMatchRow>(
      `SELECT ${baseMatchSelect} ${joinClause}
       WHERE ${teamMatchWhere} AND m.utc_date > NOW()
       ORDER BY m.utc_date ASC LIMIT 1`,
      [teamId, seasonYear]
    ),
    query<TeamFormMatchRow & { home_score: number | null; away_score: number | null }>(
      `SELECT m.id AS match_id, m.utc_date::text AS utc_date,
              m.home_team_id, m.away_team_id, m.home_score, m.away_score,
              (CASE WHEN m.home_team_id = $1 THEN at.crest_url ELSE ht.crest_url END) AS opponent_crest_url
       ${joinClause}
       WHERE ${teamMatchWhere} AND m.status IN ('FINISHED', 'IN_PLAY', 'PAUSED', 'SUSPENDED')
       ORDER BY m.utc_date DESC LIMIT 5`,
      [teamId, seasonYear]
    ),
    query<TeamNextMatchRow>(
      `SELECT ${baseMatchSelect} ${joinClause}
       WHERE ${teamMatchWhere} AND m.id = (
         SELECT ml.match_id FROM match_logs ml
         JOIN matches m2 ON m2.id = ml.match_id
         JOIN seasons s2 ON s2.id = m2.season_id
         WHERE (m2.home_team_id = $1 OR m2.away_team_id = $1) AND s2.year = $2
         GROUP BY ml.match_id
         ORDER BY COUNT(*) DESC LIMIT 1
       )`,
      [teamId, seasonYear]
    ),
    query<TeamNextMatchRow>(
      `SELECT ${baseMatchSelect} ${joinClause}
       WHERE ${teamMatchWhere} AND m.id = (
         SELECT ml.match_id FROM match_logs ml
         JOIN matches m2 ON m2.id = ml.match_id
         JOIN seasons s2 ON s2.id = m2.season_id
         WHERE (m2.home_team_id = $1 OR m2.away_team_id = $1) AND s2.year = $2 AND ml.rating IS NOT NULL
         GROUP BY ml.match_id
         ORDER BY AVG(ml.rating) DESC LIMIT 1
       )`,
      [teamId, seasonYear]
    ),
  ]);

  const form: TeamFormMatchRow[] = formRes.rows.map((r) => {
    const isHome = r.home_team_id === teamId;
    const our = isHome ? r.home_score : r.away_score;
    const opp = isHome ? r.away_score : r.home_score;
    let result: "W" | "D" | "L" = "D";
    if (our != null && opp != null) {
      result = our > opp ? "W" : our < opp ? "L" : "D";
    }
    return { ...r, result };
  });

  return {
    nextMatch: nextRes.rows[0] ?? null,
    form,
    mostWatchedMatch: watchedRes.rows[0] ?? null,
    highestRatedMatch: ratedRes.rows[0] ?? null,
  };
}

export interface TeamMatchRow {
  id: number;
  utc_date: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  competition_code: string;
  competition_name: string;
  opponent_id: number;
  opponent_name: string;
  opponent_crest_url: string | null;
  home_team_id: number;
  away_team_id: number;
  home_team_name: string;
  away_team_name: string;
  home_crest_url: string | null;
  away_crest_url: string | null;
  has_log: boolean;
  in_watched_list: boolean;
  watched: boolean;
  [key: string]: unknown;
}

export async function getTeamMatches(
  teamId: number,
  seasonYear: number
): Promise<TeamMatchRow[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let userId: string | null = null;
  let watchedListId: string | null = null;
  if (user) {
    userId = user.id;
    watchedListId = await getWatchedListIdForUser(user.id);
  }

  const sql = `
    SELECT
      m.id,
      m.utc_date::text AS utc_date,
      m.status,
      m.home_score,
      m.away_score,
      c.code AS competition_code,
      c.name AS competition_name,
      CASE WHEN m.home_team_id = $1 THEN m.away_team_id ELSE m.home_team_id END AS opponent_id,
      CASE WHEN m.home_team_id = $1 THEN at.name ELSE ht.name END AS opponent_name,
      CASE WHEN m.home_team_id = $1 THEN at.crest_url ELSE ht.crest_url END AS opponent_crest_url,
      ht.id AS home_team_id,
      at.id AS away_team_id,
      ht.name AS home_team_name,
      at.name AS away_team_name,
      ht.crest_url AS home_crest_url,
      at.crest_url AS away_crest_url,
      EXISTS (SELECT 1 FROM match_logs ml WHERE ml.match_id = m.id AND ml.user_id = $3) AS has_log,
      ($4::uuid IS NOT NULL AND EXISTS (SELECT 1 FROM list_items li WHERE li.match_id = m.id AND li.list_id = $4)) AS in_watched_list
    FROM matches m
    JOIN competitions c ON c.id = m.competition_id
    JOIN seasons s ON s.id = m.season_id
    JOIN teams ht ON ht.id = m.home_team_id
    JOIN teams at ON at.id = m.away_team_id
    WHERE (m.home_team_id = $1 OR m.away_team_id = $1) AND s.year = $2
    ORDER BY m.utc_date ASC
  `;
  const { rows } = await query<TeamMatchRow & { has_log: boolean; in_watched_list: boolean }>(
    sql,
    [teamId, seasonYear, userId, watchedListId]
  );
  return rows.map((r) => ({
    ...r,
    has_log: r.has_log ?? false,
    in_watched_list: r.in_watched_list ?? false,
    watched: (r.has_log ?? false) || (r.in_watched_list ?? false),
  }));
}

export interface TeamTableRow {
  competition_id: number;
  competition_code: string;
  competition_name: string;
  position: number;
  played_games: number;
  won: number;
  draw: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  form: string | null;
  team_id: number;
  team_name: string;
  crest_url: string | null;
  is_highlight: boolean;
  [key: string]: unknown;
}

export async function getTeamTableRows(
  teamId: number,
  seasonYear: number
): Promise<TeamTableRow[]> {
  const sql = `
    SELECT
      c.id AS competition_id,
      c.code AS competition_code,
      c.name AS competition_name,
      st.position,
      st.played_games,
      st.won,
      st.draw,
      st.lost,
      st.goals_for,
      st.goals_against,
      st.goal_difference,
      st.points,
      st.form,
      t.id AS team_id,
      t.name AS team_name,
      t.crest_url,
      (t.id = $1) AS is_highlight
    FROM standings st
    JOIN competitions c ON c.id = st.competition_id
    JOIN seasons s ON s.id = st.season_id
    JOIN teams t ON t.id = st.team_id
    WHERE st.team_id = $1 AND s.year = $2
    ORDER BY c.name ASC, st.position ASC
  `;
  const { rows } = await query<TeamTableRow>(sql, [teamId, seasonYear]);
  return rows;
}

export interface TeamStandingRow {
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
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  form: string | null;
  is_highlight: boolean;
  [key: string]: unknown;
}

export interface TeamTableFull {
  competition_id: number;
  competition_name: string;
  competition_code: string;
  rows: TeamStandingRow[];
}

/** Returns full standings table per competition for competitions the team is in this season. */
export async function getTeamTablesFull(
  teamId: number,
  seasonYear: number
): Promise<TeamTableFull[]> {
  const compsSql = `
    SELECT DISTINCT c.id AS competition_id, c.name AS competition_name, c.code AS competition_code
    FROM standings st
    JOIN competitions c ON c.id = st.competition_id
    JOIN seasons s ON s.id = st.season_id
    WHERE st.team_id = $1 AND s.year = $2
    ORDER BY c.name ASC
  `;
  const { rows: comps } = await query<{ competition_id: number; competition_name: string; competition_code: string }>(
    compsSql,
    [teamId, seasonYear]
  );
  if (comps.length === 0) return [];

  const fullSql = `
    SELECT
      c.id AS competition_id,
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
      st.goals_for,
      st.goals_against,
      st.goal_difference,
      st.points,
      st.form,
      (t.id = $1) AS is_highlight
    FROM standings st
    JOIN competitions c ON c.id = st.competition_id
    JOIN seasons s ON s.id = st.season_id
    JOIN teams t ON t.id = st.team_id
    WHERE c.id = ANY($2::int[]) AND s.year = $3
    ORDER BY c.name ASC, st.position ASC
  `;
  const compIds = comps.map((c) => c.competition_id);
  const { rows: allRows } = await query<TeamStandingRow & { competition_id: number }>(fullSql, [
    teamId,
    compIds,
    seasonYear,
  ]);
  const byComp = new Map<number, TeamStandingRow[]>();
  for (const row of allRows) {
    const { competition_id: cid, ...rest } = row;
    if (!byComp.has(cid)) byComp.set(cid, []);
    byComp.get(cid)!.push(rest as TeamStandingRow);
  }
  return comps.map((c) => ({
    competition_id: c.competition_id,
    competition_name: c.competition_name,
    competition_code: c.competition_code,
    rows: byComp.get(c.competition_id) ?? [],
  }));
}
