"use client";

import type { F1Result, F1QualifyingResult } from "@/app/actions/f1";

const TEAM_COLORS: Record<string, string> = {
  red_bull: "#0600ef",
  ferrari: "#e05252",
  mclaren: "#ff8c00",
  mercedes: "#00d2be",
  aston_martin: "#006f62",
  alpine: "#0090ff",
  williams: "#005aff",
  rb: "#2b4562",
  kick_sauber: "#00e701",
  haas: "#ffffff",
};

function getTeamColor(constructorId: string): string {
  return TEAM_COLORS[constructorId] ?? "#666666";
}

function isQualifyingResult(
  result: F1Result | F1QualifyingResult
): result is F1QualifyingResult {
  return "Q1" in result || "Q2" in result || "Q3" in result;
}

export interface F1SessionCardProps {
  title: string;
  time?: string;
  results?: (F1Result | F1QualifyingResult)[];
  fastestLap?: { driver: string; time: string };
  completed?: boolean;
  upcoming?: boolean;
}

export function F1SessionCard({
  title,
  time,
  results,
  fastestLap,
  completed = false,
  upcoming = false,
}: F1SessionCardProps) {
  return (
    <div className="mx-4 mb-3 bg-surface2 border border-border rounded-card overflow-hidden">
      <div
        className={`px-4 py-2 flex justify-between items-center ${
          completed ? "bg-green text-black" : upcoming ? "bg-surface3 text-white" : "bg-red text-white"
        }`}
      >
        <span className="font-semibold text-[0.9375rem]">{title}</span>
        {time != null && time !== "" && <span className="text-[0.875rem]">{time}</span>}
      </div>

      {results != null && results.length > 0 && (
        <div className="p-4 space-y-3">
          {results.slice(0, 5).map((result, idx) => {
            const isQuali = isQualifyingResult(result);
            const position = result.position;
            const driver = `${result.Driver.givenName} ${result.Driver.familyName}`;
            const team = result.Constructor.name;
            const teamColor = getTeamColor(result.Constructor.constructorId);

            let timeOrPoints = "";
            if (isQuali) {
              const q = result as F1QualifyingResult;
              timeOrPoints = q.Q3 ?? q.Q2 ?? q.Q1 ?? "—";
            } else {
              const raceResult = result as F1Result;
              timeOrPoints = raceResult.points ? `${raceResult.points} pts` : "—";
            }

            const positionDisplay =
              isQuali && position === "1"
                ? "🏁"
                : !isQuali && position === "1"
                  ? "🥇"
                  : !isQuali && position === "2"
                    ? "🥈"
                    : !isQuali && position === "3"
                      ? "🥉"
                      : `P${position}`;

            return (
              <div
                key={idx}
                className="flex items-center gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
              >
                <div
                  className="font-mono font-bold text-[1.125rem] w-8 text-center"
                  style={{ color: idx < 3 && !isQuali ? "#d4a847" : "inherit" }}
                >
                  {positionDisplay}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[0.9375rem]">{driver}</div>
                  <div className="text-[0.8125rem] text-muted flex items-center gap-1">
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{ background: teamColor }}
                      aria-hidden
                    />
                    {team}
                  </div>
                </div>
                <div className="font-mono text-[0.875rem]">{timeOrPoints}</div>
              </div>
            );
          })}

          {fastestLap != null && (
            <div className="mt-3 pt-3 border-t border-border bg-surface3 -m-4 -mb-4 p-3 text-[0.8125rem]">
              <span className="text-muted">⏱️ Fastest Lap:</span>{" "}
              <span className="font-semibold">{fastestLap.driver}</span> ({fastestLap.time})
            </div>
          )}
        </div>
      )}

      {upcoming && !results?.length && (
        <div className="p-4 text-center text-muted text-[0.875rem]">
          Session not started
        </div>
      )}
    </div>
  );
}
