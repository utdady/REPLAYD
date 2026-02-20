/**
 * REPLAYD — Match sync script
 * Fetches from football-data.org and upserts into Postgres.
 *
 * Usage:
 *   npx tsx scripts/sync-matches.ts
 *
 * Loads .env.local from project root. Env vars required (see .env.example):
 *   DATABASE_URL, FOOTBALL_DATA_API_KEY
 *
 * Optional:
 *   SYNC_SEASON      (default: 2024) — season year to sync (2024 = 2024/25)
 *   DRY_RUN          (default: false)
 *   DEBUG            (default: false)
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local from project root; override so file always wins over existing env
config({ path: resolve(process.cwd(), ".env.local"), override: true });

import { Pool } from "pg";

// ── Config ────────────────────────────────────────────────────────────────────

const API_BASE = "https://api.football-data.org/v4";
const API_KEY  = process.env.FOOTBALL_DATA_API_KEY ?? "";
const DRY_RUN  = process.env.DRY_RUN === "true";
const DEBUG    = process.env.DEBUG === "true";

// Season year to sync (2025 = 2025/26).
const SYNC_SEASON = parseInt(process.env.SYNC_SEASON ?? "2025", 10);

// football-data.org competition IDs we track
const COMPETITION_IDS = [2021, 2014, 2002, 2019, 2015, 2001];

// Free tier: 10 req/min → sleep 6.5s between calls to be safe
const RATE_LIMIT_MS = 6_500;

// ── Types ─────────────────────────────────────────────────────────────────────

interface FDTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

interface FDScore {
  fullTime:  { home: number | null; away: number | null };
  halfTime:  { home: number | null; away: number | null };
}

interface FDMatch {
  id:          number;
  utcDate:     string;
  status:      string;
  matchday:    number | null;
  stage:       string;
  lastUpdated: string;
  homeTeam:    FDTeam;
  awayTeam:    FDTeam;
  score:       FDScore;
}

interface FDMatchesResponse {
  matches:    FDMatch[];
  resultSet?: { count: number };
}

interface FDStandingEntry {
  position: number;
  team: FDTeam;
  playedGames: number;
  form: string | null;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

interface FDStandingsResponse {
  standings: {
    stage: string;
    type: string;
    group: string | null;
    table: FDStandingEntry[];
  }[];
}

// CUP competitions don't have standings (API returns 404)
const CUP_COMPETITION_IDS = new Set([2001]);

interface FDTeamsResponse {
  teams: FDTeam[];
  season: {
    id:              number;
    startDate:       string;
    endDate:         string;
    currentMatchday: number | null;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(...args: unknown[]) {
  console.log(new Date().toISOString(), ...args);
}

function debug(...args: unknown[]) {
  if (DEBUG) console.debug("  [debug]", ...args);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function apiFetch<T>(path: string): Promise<T> {
  if (!API_KEY) throw new Error("FOOTBALL_DATA_API_KEY is not set");
  const url = `${API_BASE}${path}`;
  debug("GET", url);

  const res = await fetch(url, {
    headers: { "X-Auth-Token": API_KEY },
  });

  if (res.status === 429) {
    log("Rate limited — waiting 60s");
    await sleep(60_000);
    return apiFetch<T>(path);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status} for ${path}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ── DB helpers ────────────────────────────────────────────────────────────────

async function upsertTeam(pool: Pool, t: FDTeam) {
  if (DRY_RUN) { debug("DRY upsertTeam", t.id, t.name); return; }
  await pool.query(
    `INSERT INTO teams (id, name, short_name, tla, crest_url)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET
       name       = EXCLUDED.name,
       short_name = EXCLUDED.short_name,
       tla        = EXCLUDED.tla,
       crest_url  = EXCLUDED.crest_url,
       updated_at = NOW()`,
    [t.id, t.name, t.shortName, t.tla, t.crest]
  );
}

async function upsertSeason(
  pool: Pool,
  competitionId: number,
  year: number,
  startDate: string,
  endDate: string,
  currentMatchday: number | null
): Promise<number> {
  if (DRY_RUN) { debug("DRY upsertSeason", competitionId, year); return -1; }
  const { rows } = await pool.query(
    `INSERT INTO seasons (competition_id, year, start_date, end_date, current_matchday)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (competition_id, year) DO UPDATE SET
       current_matchday = EXCLUDED.current_matchday,
       end_date         = EXCLUDED.end_date,
       updated_at       = NOW()
     RETURNING id`,
    [competitionId, year, startDate, endDate, currentMatchday]
  );
  return rows[0].id as number;
}

async function upsertMatch(
  pool: Pool,
  m: FDMatch,
  competitionId: number,
  seasonId: number
) {
  if (DRY_RUN) {
    debug("DRY upsertMatch", m.id, m.homeTeam.name, "vs", m.awayTeam.name);
    return;
  }
  await pool.query(
    `INSERT INTO matches (
       id, competition_id, season_id,
       home_team_id, away_team_id,
       utc_date, status, matchday, stage,
       home_score, away_score,
       home_score_ht, away_score_ht,
       last_updated
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     ON CONFLICT (id) DO UPDATE SET
       status        = EXCLUDED.status,
       matchday      = EXCLUDED.matchday,
       home_score    = EXCLUDED.home_score,
       away_score    = EXCLUDED.away_score,
       home_score_ht = EXCLUDED.home_score_ht,
       away_score_ht = EXCLUDED.away_score_ht,
       last_updated  = EXCLUDED.last_updated,
       updated_at    = NOW()
     WHERE matches.last_updated IS DISTINCT FROM EXCLUDED.last_updated`,
    [
      m.id, competitionId, seasonId,
      m.homeTeam.id, m.awayTeam.id,
      m.utcDate, m.status, m.matchday, m.stage,
      m.score.fullTime.home, m.score.fullTime.away,
      m.score.halfTime.home, m.score.halfTime.away,
      m.lastUpdated,
    ]
  );
}

async function upsertStanding(
  pool: Pool,
  competitionId: number,
  seasonId: number,
  entry: FDStandingEntry
) {
  if (DRY_RUN) { debug("DRY upsertStanding", entry.team.name, entry.position); return; }
  await pool.query(
    `INSERT INTO standings (
       competition_id, season_id, team_id,
       position, played_games, won, draw, lost, points,
       goals_for, goals_against, goal_difference, form
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT (competition_id, season_id, team_id) DO UPDATE SET
       position        = EXCLUDED.position,
       played_games    = EXCLUDED.played_games,
       won             = EXCLUDED.won,
       draw            = EXCLUDED.draw,
       lost            = EXCLUDED.lost,
       points          = EXCLUDED.points,
       goals_for       = EXCLUDED.goals_for,
       goals_against   = EXCLUDED.goals_against,
       goal_difference = EXCLUDED.goal_difference,
       form            = EXCLUDED.form,
       updated_at      = NOW()`,
    [
      competitionId, seasonId, entry.team.id,
      entry.position, entry.playedGames, entry.won, entry.draw, entry.lost, entry.points,
      entry.goalsFor, entry.goalsAgainst, entry.goalDifference, entry.form,
    ]
  );
}

async function linkTeamToSeason(
  pool: Pool,
  competitionId: number,
  seasonId: number,
  teamId: number
) {
  if (DRY_RUN) return;
  await pool.query(
    `INSERT INTO competition_teams (competition_id, season_id, team_id)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [competitionId, seasonId, teamId]
  );
}

// ── Per-competition sync ───────────────────────────────────────────────────────

async function syncCompetition(pool: Pool, competitionId: number) {
  log(`── Competition ${competitionId}`);

  // 1. Fetch teams (also gives us season metadata) for the season we sync
  const teamsData = await apiFetch<FDTeamsResponse>(
    `/competitions/${competitionId}/teams?season=${SYNC_SEASON}`
  );
  await sleep(RATE_LIMIT_MS);

  const season = teamsData.season;
  const year   = parseInt(season.startDate.slice(0, 4), 10);

  log(`   Season ${year}: ${season.startDate} → ${season.endDate}, matchday ${season.currentMatchday}`);

  const seasonId = await upsertSeason(
    pool, competitionId, year,
    season.startDate, season.endDate,
    season.currentMatchday
  );

  // 2. Upsert teams
  for (const team of teamsData.teams) {
    await upsertTeam(pool, team);
    await linkTeamToSeason(pool, competitionId, seasonId, team.id);
  }
  log(`   Upserted ${teamsData.teams.length} teams`);

  // 3. Fetch all matches for this season (2024/25) from the API
  const path = `/competitions/${competitionId}/matches?season=${SYNC_SEASON}`;
  const matchData = await apiFetch<FDMatchesResponse>(path);
  await sleep(RATE_LIMIT_MS);

  log(`   Found ${matchData.matches.length} matches for season ${SYNC_SEASON}`);

  let upserted = 0;
  for (const m of matchData.matches) {
    // Ensure both teams exist (cup competitions may have new teams mid-sync)
    await upsertTeam(pool, m.homeTeam);
    await upsertTeam(pool, m.awayTeam);
    await upsertMatch(pool, m, competitionId, seasonId);
    upserted++;
  }

  log(`   ✓ ${upserted} matches synced`);

  // 4. Fetch standings (skip CUP competitions — API returns 404)
  if (!CUP_COMPETITION_IDS.has(competitionId)) {
    try {
      const standingsData = await apiFetch<FDStandingsResponse>(
        `/competitions/${competitionId}/standings?season=${SYNC_SEASON}`
      );
      await sleep(RATE_LIMIT_MS);

      const totalStanding = standingsData.standings.find((s) => s.type === "TOTAL");
      if (totalStanding) {
        for (const entry of totalStanding.table) {
          await upsertTeam(pool, entry.team);
          await upsertStanding(pool, competitionId, seasonId, entry);
        }
        log(`   ✓ ${totalStanding.table.length} standings rows synced`);
      } else {
        log(`   ⚠ No TOTAL standings found`);
      }
    } catch (err) {
      log(`   ⚠ Standings fetch failed (may not be available):`, err);
    }
  } else {
    log(`   ⏭ Skipping standings for CUP competition`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  log("REPLAYD sync starting");
  log(`Season: ${SYNC_SEASON} (${SYNC_SEASON}/${String(SYNC_SEASON + 1).slice(-2)})`);
  if (DRY_RUN) log("DRY RUN — no DB writes");

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  // Parse DATABASE_URL manually to handle # in password
  // Format: postgresql://user:pass@host:port/dbname
  let dbUrl = process.env.DATABASE_URL;
  if (dbUrl.startsWith('"') && dbUrl.endsWith('"')) {
    dbUrl = dbUrl.slice(1, -1);
  }
  
  // Decode URL-encoded password (%23 → #)
  dbUrl = decodeURIComponent(dbUrl);
  
  // Parse manually (can't use URL constructor because # is fragment identifier)
  // Supports: postgresql:// or postgres:// (Supabase pooler uses postgres://)
  const match = dbUrl.match(/^postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid DATABASE_URL format: ${dbUrl.substring(0, 50)}...`);
  }
  
  const [, user, password, host, port, database] = match;
  const pool = new Pool({
    host,
    port: parseInt(port, 10),
    database,
    user,
    password, // This will have # decoded from %23
    max: 3,
    ssl: { rejectUnauthorized: false }, // Supabase requires SSL
  });

  try {
    for (const compId of COMPETITION_IDS) {
      try {
        await syncCompetition(pool, compId);
      } catch (err) {
        // Don't abort the whole run if one competition fails
        log(`ERROR on competition ${compId}:`, err);
      }
      // Extra breathing room between competitions
      if (compId !== COMPETITION_IDS[COMPETITION_IDS.length - 1]) {
        await sleep(RATE_LIMIT_MS);
      }
    }
    log("✓ Sync complete");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
