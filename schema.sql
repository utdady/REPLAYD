-- ============================================================
-- REPLAYD — Postgres schema
-- Run against your Supabase project via the SQL editor
-- or psql: psql $DATABASE_URL -f schema.sql
-- ============================================================

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- REFERENCE DATA (synced from football-data.org)
-- ============================================================

CREATE TABLE IF NOT EXISTS competitions (
  id          INTEGER     PRIMARY KEY,          -- football-data.org id
  name        TEXT        NOT NULL,
  code        TEXT        NOT NULL UNIQUE,      -- PL, CL, PD, BL1, SA, FL1
  emblem_url  TEXT,
  area_name   TEXT,                             -- England, Europe, etc.
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
  id          INTEGER     PRIMARY KEY,          -- football-data.org id
  name        TEXT        NOT NULL,
  short_name  TEXT,
  tla         TEXT,                             -- 3-letter abbreviation: ARS, MCI
  crest_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seasons (
  id               SERIAL      PRIMARY KEY,
  competition_id   INTEGER     NOT NULL REFERENCES competitions(id),
  year             INTEGER     NOT NULL,        -- e.g. 2024 for 2024/25
  start_date       DATE        NOT NULL,
  end_date         DATE        NOT NULL,
  current_matchday INTEGER,
  winner_id        INTEGER     REFERENCES teams(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(competition_id, year)
);

CREATE TABLE IF NOT EXISTS matches (
  id              INTEGER     PRIMARY KEY,      -- football-data.org id
  competition_id  INTEGER     NOT NULL REFERENCES competitions(id),
  season_id       INTEGER     REFERENCES seasons(id),
  home_team_id    INTEGER     NOT NULL REFERENCES teams(id),
  away_team_id    INTEGER     NOT NULL REFERENCES teams(id),
  utc_date        TIMESTAMPTZ NOT NULL,
  status          TEXT        NOT NULL,
    -- SCHEDULED | TIMED | IN_PLAY | PAUSED | FINISHED
    -- POSTPONED | SUSPENDED | CANCELLED
  matchday        INTEGER,
  stage           TEXT,
    -- REGULAR_SEASON | GROUP_STAGE | ROUND_OF_16
    -- QUARTER_FINALS | SEMI_FINALS | FINAL
  home_score      INTEGER,
  away_score      INTEGER,
  home_score_ht   INTEGER,                     -- half-time
  away_score_ht   INTEGER,
  last_updated    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Join table so we can query "all teams in EPL this season" quickly
CREATE TABLE IF NOT EXISTS competition_teams (
  competition_id  INTEGER NOT NULL REFERENCES competitions(id),
  season_id       INTEGER NOT NULL REFERENCES seasons(id),
  team_id         INTEGER NOT NULL REFERENCES teams(id),
  PRIMARY KEY (competition_id, season_id, team_id)
);

-- League standings (synced from football-data.org, TOTAL type only)
CREATE TABLE IF NOT EXISTS standings (
  competition_id  INTEGER NOT NULL REFERENCES competitions(id),
  season_id       INTEGER NOT NULL REFERENCES seasons(id),
  team_id         INTEGER NOT NULL REFERENCES teams(id),
  position        INTEGER NOT NULL,
  played_games    INTEGER NOT NULL DEFAULT 0,
  won             INTEGER NOT NULL DEFAULT 0,
  draw            INTEGER NOT NULL DEFAULT 0,
  lost            INTEGER NOT NULL DEFAULT 0,
  points          INTEGER NOT NULL DEFAULT 0,
  goals_for       INTEGER NOT NULL DEFAULT 0,
  goals_against   INTEGER NOT NULL DEFAULT 0,
  goal_difference INTEGER NOT NULL DEFAULT 0,
  form            TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (competition_id, season_id, team_id)
);

-- ============================================================
-- USER DATA
-- ============================================================

-- Extends auth.users (Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT        UNIQUE NOT NULL,
  display_name    TEXT,
  bio             TEXT,
  avatar_url      TEXT,
  cover_url       TEXT,
  favourite_team_id INTEGER   REFERENCES teams(id),
  is_private      BOOLEAN     DEFAULT FALSE,
  instagram       TEXT,
  twitter         TEXT,
  tiktok          TEXT,
  youtube         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Follow system (Instagram-style, instant follow)
CREATE TABLE IF NOT EXISTS follows (
  follower_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- Core action: logging a watched match
CREATE TABLE IF NOT EXISTS match_logs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id         INTEGER     NOT NULL REFERENCES matches(id),
  watched_date     DATE,                        -- when they watched (may differ from match date)
  rating           NUMERIC(2,1)
    CHECK (rating IS NULL OR (rating >= 0.5 AND rating <= 5.0 AND MOD(rating * 2, 1) = 0)),
  review           TEXT,
  CONSTRAINT match_logs_review_length CHECK (review IS NULL OR char_length(review) <= 180),
  is_rewatch       BOOLEAN     DEFAULT FALSE,
  contains_spoilers BOOLEAN    DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)                     -- one log per match per user
);

-- Likes on match logs (for community logs sort by likes)
CREATE TABLE IF NOT EXISTS log_likes (
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  log_id    UUID NOT NULL REFERENCES match_logs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, log_id)
);
CREATE INDEX IF NOT EXISTS idx_log_likes_log ON log_likes(log_id);

-- Comments on match logs (community posts)
CREATE TABLE IF NOT EXISTS log_comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id     UUID        NOT NULL REFERENCES match_logs(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body       TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT log_comments_body_length CHECK (char_length(body) <= 500)
);
CREATE INDEX IF NOT EXISTS idx_log_comments_log ON log_comments(log_id);
CREATE INDEX IF NOT EXISTS idx_log_comments_log_created ON log_comments(log_id, created_at);

CREATE TABLE IF NOT EXISTS lists (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  CONSTRAINT lists_title_length CHECK (char_length(title) <= 100),
  description TEXT,
  CONSTRAINT lists_description_length CHECK (description IS NULL OR char_length(description) <= 500),
  is_ranked   BOOLEAN     DEFAULT FALSE,
  is_public   BOOLEAN     DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS list_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id     UUID        NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  match_id    INTEGER     NOT NULL REFERENCES matches(id),
  position    INTEGER,                          -- NULL if list is not ranked
  note        TEXT,
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, match_id)
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Matches: most common query patterns
CREATE INDEX IF NOT EXISTS idx_matches_utc_date       ON matches(utc_date);
CREATE INDEX IF NOT EXISTS idx_matches_competition    ON matches(competition_id, utc_date);
CREATE INDEX IF NOT EXISTS idx_matches_status         ON matches(status) WHERE status IN ('SCHEDULED','TIMED','IN_PLAY','PAUSED');
CREATE INDEX IF NOT EXISTS idx_matches_home_team      ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team      ON matches(away_team_id);

-- Logs: profile page, feed
CREATE INDEX IF NOT EXISTS idx_logs_user              ON match_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_match             ON match_logs(match_id);
CREATE INDEX IF NOT EXISTS idx_logs_rating            ON match_logs(rating) WHERE rating IS NOT NULL;

-- Lists
CREATE INDEX IF NOT EXISTS idx_list_items_list        ON list_items(list_id, position);

-- Follows: feed queries
CREATE INDEX IF NOT EXISTS idx_follows_follower       ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following      ON follows(following_id);

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

-- Reference data: read-only for all (writes via backend/sync only)
ALTER TABLE competitions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons          ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams            ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches          ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "competitions_select_all"      ON competitions FOR SELECT USING (true);
CREATE POLICY "seasons_select_all"           ON seasons FOR SELECT USING (true);
CREATE POLICY "teams_select_all"             ON teams FOR SELECT USING (true);
CREATE POLICY "matches_select_all"           ON matches FOR SELECT USING (true);
CREATE POLICY "competition_teams_select_all"  ON competition_teams FOR SELECT USING (true);
CREATE POLICY "standings_select_all"         ON standings FOR SELECT USING (true);

-- User data
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists        ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows      ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, own write
CREATE POLICY "profiles_select_all"  ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own"  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own"  ON profiles FOR DELETE USING (auth.uid() = id);

-- Match logs: public read (non-spoiler), own write
CREATE POLICY "logs_select_all"      ON match_logs FOR SELECT USING (true);
CREATE POLICY "logs_insert_own"      ON match_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "logs_update_own"      ON match_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "logs_delete_own"      ON match_logs FOR DELETE USING (auth.uid() = user_id);

-- Log likes: public read, own write
CREATE POLICY "log_likes_select_all" ON log_likes FOR SELECT USING (true);
CREATE POLICY "log_likes_insert_own" ON log_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "log_likes_delete_own"  ON log_likes FOR DELETE USING (auth.uid() = user_id);

-- Log comments: public read, own insert/delete
CREATE POLICY "log_comments_select_all" ON log_comments FOR SELECT USING (true);
CREATE POLICY "log_comments_insert_own" ON log_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "log_comments_delete_own" ON log_comments FOR DELETE USING (auth.uid() = user_id);

-- Lists: public lists readable by all, private by owner only
CREATE POLICY "lists_select_public"  ON lists FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "lists_insert_own"     ON lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lists_update_own"     ON lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "lists_delete_own"     ON lists FOR DELETE USING (auth.uid() = user_id);

-- List items inherit list visibility
CREATE POLICY "list_items_select"    ON list_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM lists WHERE id = list_id AND (is_public = true OR user_id = auth.uid()))
);
CREATE POLICY "list_items_write"     ON list_items FOR ALL USING (
  EXISTS (SELECT 1 FROM lists WHERE id = list_id AND user_id = auth.uid())
);

-- Follows: public read, own write
CREATE POLICY "follows_select_all"   ON follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_own"   ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete_own"   ON follows FOR DELETE USING (auth.uid() = follower_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup.
-- SECURITY DEFINER runs as function owner (run this schema as postgres so RLS is bypassed).
-- Ensures unique username to avoid "database error saving new user" when two users share the same base name.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username text;
  new_username text;
  display text;
  suffix int := 0;
BEGIN
  -- Priority: explicit username > Google name (spaces removed) > email prefix
  base_username := COALESCE(
    NULLIF(trim(LOWER(NEW.raw_user_meta_data->>'username')), ''),
    NULLIF(LOWER(replace(COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''), ' ', '')), ''),
    LOWER(split_part(COALESCE(NEW.email, ''), '@', 1))
  );
  IF base_username IS NULL OR base_username = '' THEN
    base_username := 'user';
  END IF;
  base_username := regexp_replace(substring(base_username from 1 for 30), '[^a-zA-Z0-9_]', '_', 'g');
  IF base_username = '' THEN
    base_username := 'user';
  END IF;

  new_username := base_username;
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = new_username) LOOP
    suffix := suffix + 1;
    new_username := base_username || '_' || suffix;
  END LOOP;

  -- Display name: prefer full_name or name from OAuth
  display := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'name'), '')
  );

  INSERT INTO profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    new_username,
    display,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER touch_profiles     BEFORE UPDATE ON profiles     FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE OR REPLACE TRIGGER touch_match_logs   BEFORE UPDATE ON match_logs   FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE OR REPLACE TRIGGER touch_lists        BEFORE UPDATE ON lists        FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE OR REPLACE TRIGGER touch_matches      BEFORE UPDATE ON matches      FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE OR REPLACE TRIGGER touch_competitions BEFORE UPDATE ON competitions FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE OR REPLACE TRIGGER touch_teams        BEFORE UPDATE ON teams        FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE OR REPLACE TRIGGER touch_seasons      BEFORE UPDATE ON seasons      FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============================================================
-- SEED: competitions we track
-- ============================================================

INSERT INTO competitions (id, name, code, area_name) VALUES
  (2021, 'Premier League',    'PL',  'England'),
  (2014, 'La Liga',           'PD',  'Spain'),
  (2002, 'Bundesliga',        'BL1', 'Germany'),
  (2019, 'Serie A',           'SA',  'Italy'),
  (2015, 'Ligue 1',           'FL1', 'France'),
  (2001, 'UEFA Champions League', 'CL', 'Europe')
ON CONFLICT (id) DO UPDATE SET
  name       = EXCLUDED.name,
  code       = EXCLUDED.code,
  area_name  = EXCLUDED.area_name,
  updated_at = NOW();
