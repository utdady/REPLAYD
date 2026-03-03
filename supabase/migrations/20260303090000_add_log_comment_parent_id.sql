-- Allow threaded comments by letting each comment reference an optional parent.
-- Safe to run multiple times: check column existence first.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'log_comments'
      AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE public.log_comments
      ADD COLUMN parent_id uuid NULL REFERENCES public.log_comments(id) ON DELETE CASCADE;
  END IF;
END
$$;

