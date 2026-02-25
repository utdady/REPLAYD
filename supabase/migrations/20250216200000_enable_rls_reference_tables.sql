-- ============================================================
-- REPLAYD — Enable RLS on reference tables (fix Security Advisor)
-- Run in Supabase SQL Editor. These tables are read-only for the app;
-- only SELECT is allowed for PostgREST; writes happen via backend/sync.
-- ============================================================

ALTER TABLE competitions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons           ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams             ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches           ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_teams  ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "competitions_select_all"       ON competitions FOR SELECT USING (true);
CREATE POLICY "seasons_select_all"            ON seasons FOR SELECT USING (true);
CREATE POLICY "teams_select_all"              ON teams FOR SELECT USING (true);
CREATE POLICY "matches_select_all"            ON matches FOR SELECT USING (true);
CREATE POLICY "competition_teams_select_all"  ON competition_teams FOR SELECT USING (true);
CREATE POLICY "standings_select_all"          ON standings FOR SELECT USING (true);
