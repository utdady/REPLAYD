"use client";

import { useState, useEffect } from "react";
import { getLiveRaceData, type LiveRaceData } from "@/app/actions/f1";

export function F1LiveRaceCard() {
  const [liveData, setLiveData] = useState<LiveRaceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLiveData() {
      const data = await getLiveRaceData();
      setLiveData(data);
      setLoading(false);
    }

    fetchLiveData();
    const interval = setInterval(fetchLiveData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="mx-4 mb-3 bg-surface2 border border-border rounded-card p-4 text-center text-muted text-[0.875rem]">
        Checking for live session...
      </div>
    );
  }

  if (!liveData) return null;

  const { session, positions, drivers } = liveData;

  return (
    <div className="mx-4 mb-3 bg-surface2 border border-border rounded-card overflow-hidden">
      <div className="px-4 py-2 flex justify-between items-center bg-red text-white">
        <span className="font-semibold text-[0.9375rem] flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" aria-hidden />
            LIVE
          </span>
          <span>Race</span>
        </span>
        <span className="text-[0.875rem]">{session.location}</span>
      </div>

      <div className="p-4 space-y-3">
        {positions.slice(0, 10).map((pos) => {
          const driver = drivers.get(pos.driver_number);
          if (!driver) return null;

          const teamColor = driver.team_colour ? `#${driver.team_colour}` : "#666666";

          return (
            <div
              key={pos.driver_number}
              className="flex items-center gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
            >
              <div className="font-mono font-bold text-[1.125rem] w-8 text-center">
                P{pos.position}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[0.9375rem]">{driver.broadcast_name}</div>
                <div className="text-[0.8125rem] text-muted flex items-center gap-1">
                  <span
                    className="inline-block w-2 h-2 rounded-full shrink-0"
                    style={{ background: teamColor }}
                    aria-hidden
                  />
                  {driver.team_name}
                </div>
              </div>
              <div className="font-mono text-[0.875rem] text-green">LIVE</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
