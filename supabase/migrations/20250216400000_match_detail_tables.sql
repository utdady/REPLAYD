-- Match detail data: venue, referee, goal scorers, lineups (from football-data.org GET /matches/{id})

-- Add venue and main referee to matches
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS venue TEXT,
  ADD COLUMN IF NOT EXISTS referee_name TEXT;

-- Goals per match (scorer, minute, type, score at time of goal)
CREATE TABLE IF NOT EXISTS match_goals (
  id          SERIAL      PRIMARY KEY,
  match_id    INTEGER     NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sort_order  SMALLINT    NOT NULL DEFAULT 0,
  minute      INTEGER,
  injury_time INTEGER,
  type        TEXT,       -- REGULAR, PENALTY, OWN_GOAL, etc.
  team_id     INTEGER     NOT NULL REFERENCES teams(id),
  scorer_name TEXT        NOT NULL,
  scorer_id   INTEGER,
  assist_name TEXT,
  assist_id   INTEGER,
  score_home  INTEGER     NOT NULL,
  score_away  INTEGER     NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_match_goals_match_id ON match_goals(match_id);

-- Lineup/bench per team per match (formation, coach, players)
CREATE TABLE IF NOT EXISTS match_team_details (
  match_id    INTEGER     NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id     INTEGER     NOT NULL REFERENCES teams(id),
  side        TEXT        NOT NULL CHECK (side IN ('home', 'away')),
  formation   TEXT,
  coach_name  TEXT,
  lineup      JSONB       DEFAULT '[]',  -- [{ id, name, position, shirtNumber }]
  bench       JSONB       DEFAULT '[]',
  PRIMARY KEY (match_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_match_team_details_match_id ON match_team_details(match_id);

-- RLS: reference data, read-only for app
ALTER TABLE match_goals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_team_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "match_goals_select_all"       ON match_goals FOR SELECT USING (true);
CREATE POLICY "match_team_details_select_all" ON match_team_details FOR SELECT USING (true);
