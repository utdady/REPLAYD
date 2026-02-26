-- System lists for quick actions (Liked, Watched, Watchlist)

ALTER TABLE lists
  ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS system_key TEXT;

ALTER TABLE lists
  ADD CONSTRAINT lists_system_key_check
  CHECK (
    (is_system = FALSE AND system_key IS NULL)
    OR (is_system = TRUE AND system_key IN ('liked', 'watched', 'watchlist'))
  );

-- One system list per key per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_lists_system_user_key
  ON lists(user_id, system_key)
  WHERE is_system = TRUE;

