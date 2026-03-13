"use client";

import { useState, useEffect } from "react";

export interface F1NextRaceCardProps {
  raceName: string;
  circuit: string;
  country: string;
  date: string;
  time?: string;
}

export function F1NextRaceCard({ raceName, circuit, country, date, time }: F1NextRaceCardProps) {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const raceTime = time ?? "14:00:00";
    const raceDateTime = new Date(`${date}T${raceTime}Z`);

    const updateCountdown = () => {
      const now = new Date();
      const diff = raceDateTime.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown("Race started");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setCountdown(`${days}d ${hours}h ${minutes}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [date, time]);

  return (
    <div className="mx-4 mb-4 p-4 bg-surface2 border border-border rounded-card">
      <div className="font-mono text-[0.625rem] font-semibold tracking-wider uppercase text-muted mb-2">
        Next Race
      </div>
      <div className="text-[1.125rem] font-bold mb-1">{raceName}</div>
      <div className="text-[0.875rem] text-muted mb-3">
        {circuit} · {country}
      </div>
      <div className="font-mono text-[0.875rem] text-green bg-green/10 rounded px-3 py-2 text-center">
        ⏱️ {countdown}
      </div>
    </div>
  );
}
