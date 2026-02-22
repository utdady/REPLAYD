# Sports section — future structure

This document describes the intended hierarchy and components for each sport. The **page structure** (chip rows + “Coming soon” content) is implemented in `components/feed/`: `f1-section.tsx`, `nba-section.tsx`, `nfl-section.tsx`. Real data and backend can be added later.

## Football

Already implemented. Competition chips (All, EPL, UCL, La Liga, BL, Serie A, L1), date strip, matches feed, and standings per competition.

---

## F1

- **Standings:** Two views, same pattern as football standings (toggle or two sub-views):
  - **Drivers Championship** — driver standings
  - **Constructors Championship** — constructor/team standings

---

## NBA

- Two top-level components (e.g. chips or tabs):
  - **Eastern Conference** — has its own standings (same UX as football competition standings)
  - **Western Conference** — has its own standings (same UX as football competition standings)

---

## NFL

- Two top-level components:
  - **AFC** (American Football Conference)
  - **NFC** (National Football Conference)

- Each conference has four sub-components (e.g. chips or tabs):
  - **North**
  - **South**
  - **East**
  - **West**

- Content (standings or schedule) per division can follow the same pattern as football: select division → show that division’s data.
