# Fix "database error saving new user" on signup

If new users get **"database error saving new user"** when signing up on the deployed app, the trigger that creates their profile row is failing. Common causes:

1. **Duplicate username** – Two users get the same username (e.g. both `john` from different emails). The updated trigger now makes usernames unique by appending `_1`, `_2`, etc.
2. **Trigger not updated** – The fix is in `schema.sql`; you must run the updated trigger in Supabase so it takes effect.

## What to do

1. Open **Supabase Dashboard** → your project → **SQL Editor**.
2. Run the following SQL (same as in `schema.sql`). This replaces the `handle_new_user` function and keeps the existing trigger.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username text;
  new_username text;
  suffix int := 0;
BEGIN
  base_username := COALESCE(
    NULLIF(trim(LOWER(NEW.raw_user_meta_data->>'username')), ''),
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

  INSERT INTO profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    new_username,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;
```

3. Run it (the trigger `on_auth_user_created` already exists; it will use the new function).
4. Try signup again on the deployed app.

**Note:** Run this in the SQL Editor while logged into Supabase (as the project owner). The function uses `SECURITY DEFINER` so it runs with the definer’s privileges and can insert into `profiles` even when RLS would otherwise block it.
