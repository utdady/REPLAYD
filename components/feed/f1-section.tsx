"use client";

import { useState, useEffect } from "react";
import { startOfDay, format } from "date-fns";
import { Chip } from "@/components/ui/chip";
import { DateStrip } from "@/components/feed/date-strip";
import { SectionEyebrow } from "@/components/layout/section-eyebrow";
import { F1LiveRaceCard } from "@/components/feed/f1-live-race-card";
import { F1SessionCard } from "@/components/feed/f1-session-card";
import { F1NextRaceCard } from "@/components/feed/f1-next-race-card";
import { F1StandingsTable } from "@/components/feed/f1-standings-table";
import {
  findRaceByDate,
  getRaceResults,
  getQualifyingResults,
  getNextRace,
  getDriverStandings,
  getConstructorStandings,
  getLiveRaceData,
  type F1Race,
  type DriverStanding,
  type ConstructorStanding,
  type F1Result,
} from "@/app/actions/f1";

const F1_VIEWS = ["Drivers Championship", "Constructors Championship"] as const;
export type F1View = (typeof F1_VIEWS)[number];

const standingsBtnClass =
  "min-w-[7rem] text-[.7rem] font-semibold tracking-[.05em] uppercase font-mono px-3 py-1.5 h-7 rounded-btn transition-colors border shrink-0";

export function F1Section() {
  const today = startOfDay(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [showStandings, setShowStandings] = useState(false);
  const [activeView, setActiveView] = useState<F1View>("Drivers Championship");

  const [raceRound, setRaceRound] = useState<string | null>(null);
  const [raceResults, setRaceResults] = useState<{ race: F1Race; results: F1Result[] } | null>(null);
  const [qualifyingResults, setQualifyingResults] = useState<{
    race: F1Race;
    results: import("@/app/actions/f1").F1QualifyingResult[];
  } | null>(null);
  const [nextRace, setNextRace] = useState<F1Race | null>(null);
  const [driverStandings, setDriverStandings] = useState<DriverStanding[]>([]);
  const [constructorStandings, setConstructorStandings] = useState<ConstructorStanding[]>([]);
  const [isLiveRace, setIsLiveRace] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isToday = selectedDate.getTime() === today.getTime();

  useEffect(() => {
    async function checkLiveRace() {
      if (isToday && !showStandings) {
        const liveData = await getLiveRaceData();
        setIsLiveRace(!!liveData);
      } else {
        setIsLiveRace(false);
      }
    }
    checkLiveRace();
  }, [isToday, showStandings]);

  useEffect(() => {
    async function fetchRaceData() {
      if (showStandings) return;
      setLoading(true);
      setError(null);
      try {
        const round = await findRaceByDate(selectedDate);
        setRaceRound(round);

        if (round) {
          const [race, quali] = await Promise.all([
            getRaceResults(round),
            getQualifyingResults(round),
          ]);
          setRaceResults(race);
          setQualifyingResults(quali);
        } else {
          setRaceResults(null);
          setQualifyingResults(null);
        }

        const next = await getNextRace();
        setNextRace(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load F1 data");
        setRaceRound(null);
        setRaceResults(null);
        setQualifyingResults(null);
        setNextRace(null);
      } finally {
        setLoading(false);
      }
    }

    fetchRaceData();
  }, [selectedDate, showStandings]);

  useEffect(() => {
    async function fetchStandings() {
      if (!showStandings) return;
      setLoading(true);
      setError(null);
      try {
        const [drivers, constructors] = await Promise.all([
          getDriverStandings(),
          getConstructorStandings(),
        ]);
        setDriverStandings(drivers);
        setConstructorStandings(constructors);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load standings");
        setDriverStandings([]);
        setConstructorStandings([]);
      } finally {
        setLoading(false);
      }
    }

    fetchStandings();
  }, [showStandings]);

  const fastestLapResult =
    raceResults?.results?.find((r) => r.FastestLap?.rank === "1");
  const fastestLap =
    fastestLapResult?.FastestLap != null
      ? {
          driver: `${fastestLapResult.Driver.givenName} ${fastestLapResult.Driver.familyName}`,
          time: fastestLapResult.FastestLap.Time.time,
        }
      : undefined;

  return (
    <div className="pt-2 pb-8">
      <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} className="mt-4" />
      <div className={`px-4 pt-6 ${showStandings || isToday ? "mb-4" : ""}`}>
        <div className="flex items-center justify-between">
          {showStandings ? (
            <SectionEyebrow className="text-[1.75rem]">{activeView}</SectionEyebrow>
          ) : (
            <SectionEyebrow className="text-[1.75rem]">
              {isToday ? "Today" : format(selectedDate, "EEE d MMM")}
            </SectionEyebrow>
          )}
          <button
            onClick={() => setShowStandings((s) => !s)}
            className={`${standingsBtnClass} ${showStandings ? "bg-green text-black border-transparent" : "bg-surface2 text-muted border-border2 hover:text-white"}`}
          >
            Standings
          </button>
        </div>
      </div>

      {error != null ? (
        <div className="px-4 text-center py-12">
          <p className="text-muted mb-2">
            {error.toLowerCase().includes("fetch") ? "Unable to load F1 data. Check your connection." : error}
          </p>
          <p className="text-[0.8125rem] text-muted">Ergast API may be slow or unreachable. Try again in a moment.</p>
        </div>
      ) : loading ? (
        <div className="px-4 text-center text-muted py-12">Loading…</div>
      ) : !showStandings ? (
        <>
          {isLiveRace && <F1LiveRaceCard />}

          {!isLiveRace && nextRace != null && !raceRound && (
            <F1NextRaceCard
              raceName={nextRace.raceName}
              circuit={nextRace.Circuit.circuitName}
              country={nextRace.Circuit.Location.country}
              date={nextRace.date}
              time={nextRace.time}
            />
          )}

          {raceRound != null ? (
            <>
              {qualifyingResults != null && (
                <F1SessionCard
                  title="Qualifying"
                  time={qualifyingResults.race.Qualifying?.time ?? "—"}
                  results={qualifyingResults.results}
                  completed
                />
              )}
              {raceResults != null && (
                <F1SessionCard
                  title="Race"
                  time={raceResults.race.time ?? "—"}
                  results={raceResults.results}
                  fastestLap={fastestLap}
                  completed
                />
              )}
            </>
          ) : !isLiveRace ? (
            <div className="px-4 text-center text-muted py-12">
              No race on this date.
              {nextRace != null && (
                <div className="mt-2 text-[0.875rem]">
                  Next race: {nextRace.raceName} · {format(new Date(nextRace.date), "EEE d MMM")}
                </div>
              )}
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div className="px-4">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-6">
              {F1_VIEWS.map((view) => (
                <Chip key={view} active={activeView === view} onClick={() => setActiveView(view)}>
                  {view}
                </Chip>
              ))}
            </div>
          </div>

          <F1StandingsTable
            type={activeView === "Drivers Championship" ? "drivers" : "constructors"}
            standings={
              activeView === "Drivers Championship" ? driverStandings : constructorStandings
            }
          />
        </>
      )}
    </div>
  );
}
