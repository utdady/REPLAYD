-- ============================================================
-- REPLAYD — Match detail: venue, referee, goal scorers, lineups
-- Populated by sync from football-data.org GET /matches/{id}.
-- ============================================================

-- Venue and main referee on matches
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS venue TEXT,
  ADD COLUMN IF NOT EXISTS referee_name TEXT;

-- Goal scorers per match (order by sort_order = chronological)
CREATE TABLE IF NOT EXISTS match_goals (
  id          SERIAL      PRIMARY KEY,
  match_id    INTEGER     NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sort_order  SMALLINT    NOT NULL,
  minute      SMALLINT,
  injury_time SMALLINT,
  type        TEXT,       -- REGULAR | PENALTY | OWN_GOAL | etc.
  team_id     INTEGER     NOT NULL REFERENCES teams(id),
  scorer_name TEXT        NOT NULL,
  scorer_id   INTEGER,
  assist_name TEXT,
  assist_id   INTEGER,
  score_home  SMALLINT    NOT NULL,
  score_away  SMALLINT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_match_goals_match_id ON match_goals(match_id);

-- Lineup/bench per team per match (formation, coach, players as JSONB)
CREATE TABLE IF NOT EXISTS match_team_details (
  match_id    INTEGER     NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id     INTEGER     NOT NULL REFERENCES teams(id),
  side        TEXT        NOT NULL CHECK (side IN ('home', 'away')),
  formation   TEXT,
  coach_name  TEXT,
  lineup      JSONB       NOT NULL DEFAULT '[]',  -- [{id,name,position,shirtNumber}]
  bench       JSONB       NOT NULL DEFAULT '[]',
  PRIMARY KEY (match_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_match_team_details_match_id ON match_team_details(match_id);
