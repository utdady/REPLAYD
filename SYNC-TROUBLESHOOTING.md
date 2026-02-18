# Sync script troubleshooting

## Error: `getaddrinfo ENOTFOUND db.xxxxx.supabase.co`

The **direct** Supabase connection uses **IPv6**. If your network or machine doesn’t support IPv6, the hostname may not resolve and you’ll see this error.

**Fix: use the Session pooler (IPv4-friendly)**

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Click **Connect** (top of the page).
3. Choose **Session** (or **Connection pooling** → Session mode).
4. Copy the **URI** (it will look like  
   `postgres://postgres.xxxxx:[PASSWORD]@aws-0-xx.pooler.supabase.com:5432/postgres`).
5. Put it in `.env.local` as `DATABASE_URL`:
   - If the password contains `#`, either:
     - Put the whole URI in quotes:  
       `DATABASE_URL="postgres://postgres.xxxxx:YourPass#123@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"`
     - Or URL-encode `#` as `%23`:  
       `DATABASE_URL=postgres://postgres.xxxxx:YourPass%23123@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`
6. Run the sync again:
   ```bash
   npx tsx scripts/sync-matches.ts
   ```

The sync script supports both `postgresql://` (direct) and `postgres://` (pooler) and handles `#` in the password.

## Run sync from your machine

The script is intended to run where your app runs (your PC, CI, etc.). Run it from the project root:

```bash
npm install
npx tsx scripts/sync-matches.ts
```

Ensure `.env.local` has:

- `DATABASE_URL` – from Dashboard → Connect → **Session** (or Direct if IPv6 works).
- `FOOTBALL_DATA_API_KEY` – from [football-data.org](https://www.football-data.org/).

Optional: `DRY_RUN=true` to test without writing to the DB.
