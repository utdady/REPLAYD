# REPLAYD Setup Guide

## 1. Database Schema

Run `schema.sql` in your Supabase SQL editor:

1. Go to **Supabase Dashboard → SQL Editor**
2. Click **New query**
3. Paste the entire contents of `schema.sql`
4. Click **Run** (or press Ctrl+Enter)

This creates:
- All tables (competitions, teams, seasons, matches, profiles, match_logs, lists, etc.)
- Indexes for performance
- RLS policies for security
- Triggers (auto-create profile on signup, auto-update timestamps)
- Seeds the 6 competitions (PL, PD, BL1, SA, FL1, CL)

**The schema is idempotent** — safe to run multiple times.

## 2. Data Sync

### Local testing

```bash
npm install
npx tsx scripts/sync-matches.ts
```

Requires in `.env.local`:
- `DATABASE_URL`
- `FOOTBALL_DATA_API_KEY` (get from https://www.football-data.org/)

### GitHub Actions (automatic)

1. Go to your GitHub repo → **Settings → Secrets and variables → Actions**
2. Add these secrets:
   - `DATABASE_URL` — your Supabase connection string
   - `FOOTBALL_DATA_API_KEY` — your football-data.org API key
3. The workflow runs automatically every 6 hours
4. You can also trigger it manually: **Actions → Sync Matches → Run workflow**

## 3. PWA Icons

Create these icons and place them in `public/icons/`:
- `icon-192.png` (192×192px)
- `icon-512.png` (512×512px)

Use your logo/brand colors. These are required for PWA install prompts.

## 4. Verify Setup

1. **Database**: Check Supabase → Table Editor → you should see `competitions`, `teams`, `matches`, `profiles`, etc.
2. **Sync**: Run sync script locally or wait for GitHub Actions — check `matches` table has data
3. **Auth**: Sign up → check `profiles` table has your user
4. **PWA**: Open on mobile → browser should show "Add to Home Screen" prompt

## Next Steps

- Wire HomeFeed to real match data from DB
- Implement match logging (use `match_logs` table)
- Build list creation/management
- Add search (trigram on teams/competitions)
