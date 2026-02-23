-- ============================================================
-- REPLAYD — Add CHECK constraints for input limits (defense in depth)
-- Run this after schema.sql if you already have the base schema.
-- Ensures the database rejects oversized or invalid data even if
-- app validation is bypassed.
-- ============================================================

-- Ensure no existing rows exceed limits before adding constraints
-- (uncomment and run if you have legacy data that might exceed limits)
/*
UPDATE match_logs SET review = left(review, 180) WHERE review IS NOT NULL AND char_length(review) > 180;
UPDATE lists SET title = left(title, 100) WHERE char_length(title) > 100;
UPDATE lists SET description = left(description, 500) WHERE description IS NOT NULL AND char_length(description) > 500;
*/

-- match_logs: review max 180 characters
ALTER TABLE match_logs
  DROP CONSTRAINT IF EXISTS match_logs_review_length,
  ADD CONSTRAINT match_logs_review_length CHECK (review IS NULL OR char_length(review) <= 180);

-- lists: title max 100, description max 500
ALTER TABLE lists
  DROP CONSTRAINT IF EXISTS lists_title_length,
  ADD CONSTRAINT lists_title_length CHECK (char_length(title) <= 100);

ALTER TABLE lists
  DROP CONSTRAINT IF EXISTS lists_description_length,
  ADD CONSTRAINT lists_description_length CHECK (description IS NULL OR char_length(description) <= 500);
