"use client";

import { useState, useRef, useEffect } from "react";
import { addDays, format, isToday, startOfDay } from "date-fns";
import { DatePickerPopover } from "@/components/feed/date-picker-popover";

export interface DateStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  className?: string;
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export function DateStrip({
  selectedDate,
  onSelectDate,
  className = "",
}: DateStripProps) {
  const today = startOfDay(new Date());
  // 14-day window: 7 days before today, today, 6 days after
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 7));

  const [calendarOpen, setCalendarOpen] = useState<"left" | "right" | null>(null);
  const leftBtnRef = useRef<HTMLButtonElement>(null);
  const rightBtnRef = useRef<HTMLButtonElement>(null);

  const handlePickDate = (date: Date) => {
    onSelectDate(date);
    setCalendarOpen(null);
  };

  return (
    <div className={`flex items-stretch gap-1 px-4 pb-2 ${className}`}>
      <button
        ref={leftBtnRef}
        type="button"
        onClick={() => setCalendarOpen((o) => (o === "left" ? null : "left"))}
        className="shrink-0 flex items-center justify-center w-10 h-[52px] rounded-md text-muted hover:text-white hover:bg-surface3 transition-colors"
        aria-label="Open calendar"
      >
        <CalendarIcon />
      </button>
      <div className="flex gap-0 flex-1 min-w-0 overflow-x-auto date-strip-scroll justify-center">
        {days.map((d) => {
          const active = selectedDate.getTime() === d.getTime();
          const isTodayDate = isToday(d);
          const isBoth = active && isTodayDate;
          let btnClass = "text-muted hover:text-white";
          if (isBoth) {
            btnClass = "bg-green-dim text-green ring-1 ring-green";
          } else if (active) {
            btnClass = "bg-green-dim text-green";
          } else if (isTodayDate) {
            btnClass = "ring-1 ring-green text-green bg-transparent";
          }
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onSelectDate(d)}
              className={`shrink-0 flex flex-col items-center py-2 px-3 rounded-md min-w-[52px] transition-colors ${btnClass}`}
            >
              <span className="text-[10px] font-mono uppercase tracking-wider">{DOW[d.getDay()]}</span>
              <span className="text-sm font-mono font-medium">{format(d, "d")}</span>
            </button>
          );
        })}
      </div>
      <button
        ref={rightBtnRef}
        type="button"
        onClick={() => setCalendarOpen((o) => (o === "right" ? null : "right"))}
        className="shrink-0 flex items-center justify-center w-10 h-[52px] rounded-md text-muted hover:text-white hover:bg-surface3 transition-colors"
        aria-label="Open calendar"
      >
        <CalendarIcon />
      </button>
      {calendarOpen && (
        <DatePickerPopover
          selectedDate={selectedDate}
          onSelectDate={handlePickDate}
          onClose={() => setCalendarOpen(null)}
          anchorRef={calendarOpen === "left" ? leftBtnRef : rightBtnRef}
          align={calendarOpen === "left" ? "start" : "end"}
        />
      )}
    </div>
  );
}
