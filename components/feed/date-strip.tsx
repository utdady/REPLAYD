"use client";

import { useMemo } from "react";
import { addDays, format, isToday, startOfDay } from "date-fns";

export interface DateStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  /** Selected year (e.g. 2024). Optional; if provided, shows year dropdown. */
  selectedYear?: number;
  onSelectYear?: (year: number) => void;
  /** Years to show in dropdown (e.g. [2023, 2024, 2025]). Defaults to current ± 2. */
  yearOptions?: number[];
  className?: string;
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DateStrip({
  selectedDate,
  onSelectDate,
  selectedYear,
  onSelectYear,
  yearOptions,
  className = "",
}: DateStripProps) {
  const currentYear = new Date().getFullYear();
  const years = yearOptions ?? [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
  const year = selectedYear ?? currentYear;

  // Generate 30 days centered around selectedDate (or today if no selection)
  const days = useMemo(() => {
    const center = selectedDate || startOfDay(new Date());
    const start = addDays(center, -15); // 15 days before
    return Array.from({ length: 30 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  return (
    <div className={`flex items-stretch gap-2 px-4 pb-2 ${className}`}>
      {onSelectYear && (
        <div className="shrink-0 flex flex-col justify-center">
          <label htmlFor="feed-year" className="text-[10px] font-mono uppercase tracking-wider text-muted mb-0.5">
            Year
          </label>
          <select
            id="feed-year"
            value={year}
            onChange={(e) => onSelectYear(Number(e.target.value))}
            className="h-9 min-w-[72px] rounded-md border border-border2 bg-surface3 px-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-green"
            aria-label="Filter by year"
          >
            {years.map((y) => (
              <option key={y} value={y} className="bg-surface2 text-white">
                {y}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex gap-0 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
        {days.map((d) => {
          const active = selectedDate && selectedDate.getTime() === d.getTime();
          const isTodayDate = isToday(d);
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onSelectDate(d)}
              className={`shrink-0 flex flex-col items-center py-2 px-3 rounded-md min-w-[52px] transition-colors ${
                active || isTodayDate ? "bg-green-dim text-green" : "text-muted hover:text-white"
              }`}
            >
              <span className="text-[10px] font-mono uppercase tracking-wider">{DOW[d.getDay()]}</span>
              <span className="text-sm font-mono font-medium">{format(d, "d")}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
