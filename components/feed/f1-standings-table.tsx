"use client";

import type { DriverStanding, ConstructorStanding } from "@/app/actions/f1";

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

export interface F1StandingsTableProps {
  type: "drivers" | "constructors";
  standings: DriverStanding[] | ConstructorStanding[];
}

export function F1StandingsTable({ type, standings }: F1StandingsTableProps) {
  const maxPoints =
    standings.length > 0 ? parseInt((standings[0] as { points: string }).points, 10) : 1;

  return (
    <div className="px-4 pb-4">
      {standings.map((standing, idx) => {
        const position = standing.position;
        const points = parseInt(standing.points, 10);
        const gap = idx === 0 ? "" : `-${maxPoints - points}`;
        const progress = maxPoints > 0 ? (points / maxPoints) * 100 : 0;

        if (type === "drivers") {
          const driverStanding = standing as DriverStanding;
          const driver = `${driverStanding.Driver.givenName} ${driverStanding.Driver.familyName}`;
          const team = driverStanding.Constructors[0]?.name ?? "";
          const teamColor = getTeamColor(driverStanding.Constructors[0]?.constructorId ?? "");

          return (
            <div
              key={position}
              className={`grid grid-cols-[2.5rem_1fr_4rem] gap-3 py-3 border-b border-border items-center ${
                idx === 0 ? "bg-green/5" : ""
              }`}
            >
              <div className="font-mono font-bold text-[1.25rem] text-center">{position}</div>
              <div className="min-w-0">
                <div className="font-semibold text-[0.9375rem]">{driver}</div>
                <div className="text-[0.8125rem] text-muted flex items-center gap-1">
                  <span
                    className="inline-block w-2 h-2 rounded-full shrink-0"
                    style={{ background: teamColor }}
                    aria-hidden
                  />
                  {team}
                </div>
                <div className="h-[3px] bg-border rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-green rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-[1rem]">{points}</div>
                {gap !== "" && <div className="font-mono text-[0.75rem] text-muted">{gap}</div>}
              </div>
            </div>
          );
        }

        const constructorStanding = standing as ConstructorStanding;
        const team = constructorStanding.Constructor.name;
        const teamColor = getTeamColor(constructorStanding.Constructor.constructorId);

        return (
          <div
            key={position}
            className={`grid grid-cols-[2.5rem_1fr_4rem] gap-3 py-3 border-b border-border items-center ${
              idx === 0 ? "bg-green/5" : ""
            }`}
          >
            <div className="font-mono font-bold text-[1.25rem] text-center">{position}</div>
            <div className="min-w-0">
              <div className="font-semibold text-[0.9375rem] flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-full shrink-0"
                  style={{ background: teamColor }}
                  aria-hidden
                />
                {team}
              </div>
              <div className="h-[3px] bg-border rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-green rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-[1rem]">{points}</div>
              {gap !== "" && <div className="font-mono text-[0.75rem] text-muted">{gap}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
