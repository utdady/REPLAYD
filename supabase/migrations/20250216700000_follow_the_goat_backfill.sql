-- FOLLOW THE GOAT: one-off backfill so existing users follow the dev account.
-- Run this migration once after enabling NEXT_PUBLIC_FOLLOW_THE_GOAT if you want
-- existing profiles to follow addybhaskar. New users are auto-followed in app code.
INSERT INTO follows (follower_id, following_id)
SELECT p.id, d.id
FROM profiles p
CROSS JOIN (SELECT id FROM profiles WHERE LOWER(username) = 'addybhaskar' LIMIT 1) d
WHERE p.id != d.id
  AND NOT EXISTS (
    SELECT 1 FROM follows f
    WHERE f.follower_id = p.id AND f.following_id = d.id
  )
ON CONFLICT (follower_id, following_id) DO NOTHING;
