-- ============================================================
-- REPLAYD — Fix "Function Search Path Mutable" warning
-- Sets search_path on touch_updated_at so the function resolves
-- objects in a fixed schema. Run in Supabase SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
