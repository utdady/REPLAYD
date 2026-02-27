# REPLAYD

Letterboxd-style web app for games (football first, more sports coming). Log games, rate them, write reviews, tag them, build lists.

**V1 scope:** Premier League, La Liga, Bundesliga, Serie A, Ligue 1, UEFA Champions League — 2024/25 season only.

## Stack

- **Framework:** Next.js 14+ (App Router, TypeScript)
- **Database:** Postgres 15 via Supabase
- **Auth:** Supabase Auth (`@supabase/ssr`)
- **Styling:** Tailwind CSS (design system in `app/globals.css`)
- **DB access:** Raw `pg` in `lib/db.ts` — no ORM

## Setup

1. Copy `.env.example` to `.env.local` and fill in Supabase and DB credentials.
2. `npm install`
3. `npm run dev`

## Scripts

- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — ESLint

## Project layout

- `app/` — routes and pages (App Router)
- `components/` — `ui/`, `layout/`, `match/`, `feed/`, `log/`
- `lib/` — `db.ts`, `supabase/` (auth server/client/middleware)

Data sync from football-data.org is intended to run via **GitHub Actions** (cron); the app never calls third-party APIs directly.

## Design

Colors, typography (Bebas Neue, DM Sans, DM Mono), and UI patterns are defined in the project prompt and implemented in `app/globals.css` and Tailwind config. Do not introduce new colors or fonts without explicit instruction.
