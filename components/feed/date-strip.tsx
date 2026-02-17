"use client";

import { useMemo } from "react";
import { addDays, format, isToday, startOfDay } from "date-fns";

export interface DateStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  className?: string;
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DateStrip({ selectedDate, onSelectDate, className = "" }: DateStripProps) {
  const days = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, i) => addDays(today, i - 3));
  }, []);

  return (
    <div className={`flex gap-0 px-4 pb-2 overflow-x-auto scrollbar-hide ${className}`}>
      {days.map((d) => {
        const active = isToday(d) || (selectedDate && isToday(selectedDate) && d.getTime() === selectedDate.getTime());
        return (
          <button
            key={d.toISOString()}
            type="button"
            onClick={() => onSelectDate(d)}
            className={`shrink-0 flex flex-col items-center py-2 px-3 rounded-md min-w-[52px] transition-colors ${
              active ? "bg-green-dim text-green" : "text-muted hover:text-white"
            }`}
          >
            <span className="text-[10px] font-mono uppercase tracking-wider">{DOW[d.getDay()]}</span>
            <span className="text-sm font-mono font-medium">{format(d, "d")}</span>
          </button>
        );
      })}
    </div>
  );
}
