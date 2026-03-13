"use server";

import { unstable_cache } from "next/cache";

const ERGAST_BASE = "https://ergast.com/api/f1";
const OPENF1_BASE = "https://api.openf1.org/v1";
const FETCH_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface F1Race {
  round: string;
  raceName: string;
  Circuit: {
    circuitName: string;
    Location: {
      locality: string;
      country: string;
    };
  };
  date: string;
  time?: string;
  Qualifying?: { date: string; time?: string };
  FirstPractice?: { date: string; time?: string };
  SecondPractice?: { date: string; time?: string };
  ThirdPractice?: { date: string; time?: string };
  Sprint?: { date: string; time?: string };
}

export interface F1Result {
  position: string;
  Driver: {
    givenName: string;
    familyName: string;
    code?: string;
  };
  Constructor: {
    name: string;
    constructorId: string;
  };
  Time?: { time: string };
  FastestLap?: {
    Time: { time: string };
    rank: string;
  };
  points: string;
}

export interface F1QualifyingResult {
  position: string;
  Driver: {
    givenName: string;
    familyName: string;
    code?: string;
  };
  Constructor: {
    name: string;
    constructorId: string;
  };
  Q1?: string;
  Q2?: string;
  Q3?: string;
}

export interface DriverStanding {
  position: string;
  Driver: {
    givenName: string;
    familyName: string;
    code?: string;
    nationality: string;
  };
  Constructors: Array<{ name: string; constructorId: string }>;
  points: string;
  wins: string;
}

export interface ConstructorStanding {
  position: string;
  Constructor: {
    name: string;
    constructorId: string;
    nationality: string;
  };
  points: string;
  wins: string;
}

export interface OpenF1Session {
  session_key: number;
  session_name: string;
  date_start: string;
  date_end: string;
  gmt_offset: string;
  session_type: string;
  meeting_key: number;
  location: string;
  country_name: string;
  circuit_short_name: string;
  year: number;
}

export interface OpenF1Position {
  date: string;
  driver_number: number;
  position: number;
  session_key: number;
}

export interface OpenF1Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  session_key: number;
  headshot_url?: string;
}

export interface LiveRaceData {
  session: OpenF1Session;
  positions: OpenF1Position[];
  drivers: Map<number, OpenF1Driver>;
  isLive: boolean;
}

export const getF1Calendar = unstable_cache(
  async () => {
    const res = await fetchWithTimeout(`${ERGAST_BASE}/current.json`);
    if (!res.ok) throw new Error("Failed to fetch F1 calendar");
    const data = await res.json();
    return data.MRData.RaceTable.Races as F1Race[];
  },
  ["f1-calendar"],
  { revalidate: 3600 }
);

export async function getRaceResults(round: string) {
  return unstable_cache(
    async () => {
      const res = await fetchWithTimeout(`${ERGAST_BASE}/current/${round}/results.json`);
      if (!res.ok) return null;
      const data = await res.json();
      const race = data.MRData?.RaceTable?.Races?.[0];
      if (!race) return null;
      return {
        race: race as F1Race,
        results: race.Results as F1Result[],
      };
    },
    ["f1-race-results", round],
    { revalidate: 600 }
  )();
}

export async function getQualifyingResults(round: string) {
  return unstable_cache(
    async () => {
      const res = await fetchWithTimeout(`${ERGAST_BASE}/current/${round}/qualifying.json`);
      if (!res.ok) return null;
      const data = await res.json();
      const race = data.MRData?.RaceTable?.Races?.[0];
      if (!race) return null;
      return {
        race: race as F1Race,
        results: race.QualifyingResults as F1QualifyingResult[],
      };
    },
    ["f1-qualifying-results", round],
    { revalidate: 600 }
  )();
}

export const getDriverStandings = unstable_cache(
  async () => {
    const res = await fetchWithTimeout(`${ERGAST_BASE}/current/driverStandings.json`);
    if (!res.ok) throw new Error("Failed to fetch driver standings");
    const data = await res.json();
    const list = data.MRData?.StandingsTable?.StandingsLists?.[0];
    return (list?.DriverStandings ?? []) as DriverStanding[];
  },
  ["f1-driver-standings"],
  { revalidate: 3600 }
);

export const getConstructorStandings = unstable_cache(
  async () => {
    const res = await fetchWithTimeout(`${ERGAST_BASE}/current/constructorStandings.json`);
    if (!res.ok) throw new Error("Failed to fetch constructor standings");
    const data = await res.json();
    const list = data.MRData?.StandingsTable?.StandingsLists?.[0];
    return (list?.ConstructorStandings ?? []) as ConstructorStanding[];
  },
  ["f1-constructor-standings"],
  { revalidate: 3600 }
);

export const getNextRace = unstable_cache(
  async () => {
    const res = await fetchWithTimeout(`${ERGAST_BASE}/current/next.json`);
    if (!res.ok) return null;
    const data = await res.json();
    const races = data.MRData?.RaceTable?.Races ?? [];
    return races.length > 0 ? (races[0] as F1Race) : null;
  },
  ["f1-next-race"],
  { revalidate: 3600 }
);

export async function findRaceByDate(date: Date | string): Promise<string | null> {
  const calendar = await getF1Calendar();
  const d = typeof date === "string" ? new Date(date) : date;
  const targetTime = d.getTime();

  const race = calendar.find((r) => {
    const raceDate = new Date(r.date);
    const raceTime = raceDate.getTime();
    const daysBefore = Math.floor((raceTime - targetTime) / (1000 * 60 * 60 * 24));
    return daysBefore >= 0 && daysBefore <= 2;
  });

  return race ? race.round : null;
}

export async function getOpenF1Sessions(year: number, countryName: string): Promise<OpenF1Session[]> {
  const res = await fetch(
    `${OPENF1_BASE}/sessions?year=${year}&country_name=${encodeURIComponent(countryName)}`
  );
  if (!res.ok) return [];
  return res.json();
}

export async function getLatestSession(): Promise<OpenF1Session | null> {
  const now = new Date();
  const year = now.getFullYear();

  const res = await fetch(`${OPENF1_BASE}/sessions?year=${year}`);
  if (!res.ok) return null;

  const sessions: OpenF1Session[] = await res.json();
  const liveSession = sessions.find((s) => {
    const start = new Date(s.date_start);
    const end = new Date(s.date_end);
    return start <= now && now <= end && s.session_name === "Race";
  });

  return liveSession ?? null;
}

export async function getLivePositions(sessionKey: number): Promise<OpenF1Position[]> {
  const res = await fetch(`${OPENF1_BASE}/position?session_key=${sessionKey}`);
  if (!res.ok) return [];
  const positions: OpenF1Position[] = await res.json();

  const latestPositions = new Map<number, OpenF1Position>();
  positions.forEach((p) => {
    const existing = latestPositions.get(p.driver_number);
    if (!existing || new Date(p.date) > new Date(existing.date)) {
      latestPositions.set(p.driver_number, p);
    }
  });

  return Array.from(latestPositions.values()).sort((a, b) => a.position - b.position);
}

export async function getSessionDrivers(sessionKey: number): Promise<OpenF1Driver[]> {
  const res = await fetch(`${OPENF1_BASE}/drivers?session_key=${sessionKey}`);
  if (!res.ok) return [];
  return res.json();
}

export async function getLiveRaceData(): Promise<LiveRaceData | null> {
  const session = await getLatestSession();
  if (!session) return null;

  const [positions, driversArray] = await Promise.all([
    getLivePositions(session.session_key),
    getSessionDrivers(session.session_key),
  ]);

  const drivers = new Map(driversArray.map((d) => [d.driver_number, d]));

  return {
    session,
    positions,
    drivers,
    isLive: true,
  };
}
