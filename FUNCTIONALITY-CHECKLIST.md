# REPLAYD — Run & functionality checklist

## Run the app

In a terminal (PowerShell or Command Prompt) where Node/npm are available:

```bash
cd c:\Users\addyb\OneDrive\Desktop\REPLAYD
npm install
npm run dev
```

Then open **http://localhost:3000** in your browser.

---

## Functionality to check

### Landing (home `/`)
- [ ] Page loads without errors
- [ ] Nav: logo (REPLAY green, D white), Matches · Lists · Community, Log in, **Sign up free**
- [ ] Hero: eyebrow, “EVERY MATCH YOU'VE EVER SEEN.”, subtitle, “Start for free →”, “See how it works ↓”
- [ ] Phone mockup: notch, app bar, tabs (Matches active), comp chips, date strip, 3 match cards, “Popular this week” row, “New from friends” row, bottom nav (Matches, Search, +, Activity, Profile)
- [ ] Ticker: scrolling match results
- [ ] Features: “THREE THINGS. THAT'S IT.”, 3 cards (Log it, Rate it, List it)
- [ ] Competitions: 6 competitions grid
- [ ] CTA: email field + “Get early access”
- [ ] Footer: REPLAYD, About / Privacy / Twitter / API, © 2025
- [ ] “See how it works” scrolls to **#how-it-works** (Features section)
- [ ] Grain texture visible on page

### Navigation
- [ ] **Sign up free** → `/signup`
- [ ] **Log in** → `/login`
- [ ] **Matches** → `/`
- [ ] **Lists** → `/lists`
- [ ] **Community** → `/community`
- [ ] Bottom nav (mobile): Matches, Search, +, Activity, Profile go to correct routes

### Auth pages
- [ ] `/login`: logo, email/password fields, Log in button, “Continue with Google”, “Sign up” link
- [ ] `/signup`: same layout, “Log in” link

### Other routes (stubs)
- [ ] `/matches/m1` (or any id): match detail, tabs, “Log this match” CTA
- [ ] `/users/footy_fan`: profile, stats, recent matches
- [ ] `/lists/some-id`: list detail
- [ ] `/search`, `/activity`, `/log`, `/community`, `/lists`: placeholder copy

### Feed (for when you add auth)
- [ ] `HomeFeed` component is at `components/landing/home-feed.tsx`; once you show it for logged-in users on `/`, you get today’s matches, comp chips, date strip, popular row, friends row

---

## If something fails

- **Port in use:** run `npm run dev -- -p 3001` (or another port).
- **Module not found:** run `npm install` again.
- **Styles wrong:** confirm `tailwind.config.ts` and `app/globals.css` match the repo (no local overrides).
- **Profile redirect:** `/profile` redirects to `/users/me`; “me” will 404 until you wire auth and resolve “me” to the current user.
