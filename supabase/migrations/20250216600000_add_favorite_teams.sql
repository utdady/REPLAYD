-- Favorite teams (multiple per user)

CREATE TABLE IF NOT EXISTS favorite_teams (
  user_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id   INTEGER     NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_favorite_teams_user ON favorite_teams(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_teams_team ON favorite_teams(team_id);

ALTER TABLE favorite_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorite_teams_select_own" ON favorite_teams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorite_teams_insert_own" ON favorite_teams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorite_teams_delete_own" ON favorite_teams FOR DELETE USING (auth.uid() = user_id);
