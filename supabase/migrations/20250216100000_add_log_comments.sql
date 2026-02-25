-- ============================================================
-- REPLAYD — Add log_comments table for community post comments
-- Run if you already have the base schema.
-- ============================================================

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

ALTER TABLE log_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "log_comments_select_all" ON log_comments FOR SELECT USING (true);
CREATE POLICY "log_comments_insert_own" ON log_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "log_comments_delete_own" ON log_comments FOR DELETE USING (auth.uid() = user_id);
