"use client";

import { useState, useRef } from "react";
import { addDays, format, isToday, startOfDay } from "date-fns";
import { DatePickerPopover } from "@/components/feed/date-picker-popover";

export interface DateStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  className?: string;
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CELL_MIN_W = "min-w-[44px]";
const CELL_HEIGHT = "h-11";

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

  const calendarBtnClass = `shrink-0 flex items-center justify-center ${CELL_MIN_W} ${CELL_HEIGHT} rounded-md text-muted hover:text-white hover:bg-surface3 transition-colors`;

  return (
    <div className={`px-4 pb-2 ${className}`}>
      <div className="flex gap-0 min-w-0 overflow-x-auto date-strip-scroll py-1.5">
        <button
          ref={leftBtnRef}
          type="button"
          onClick={() => setCalendarOpen((o) => (o === "left" ? null : "left"))}
          className={calendarBtnClass}
          aria-label="Open calendar"
        >
          <CalendarIcon />
        </button>
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
              className={`shrink-0 flex flex-col items-center justify-center py-1.5 px-2 rounded-md ${CELL_MIN_W} ${CELL_HEIGHT} transition-colors ${btnClass}`}
            >
              <span className="text-[.7rem] font-mono uppercase tracking-wider leading-tight">{DOW[d.getDay()]}</span>
              <span className="text-sm font-mono font-medium leading-tight">{format(d, "d")}</span>
            </button>
          );
        })}
        <button
          ref={rightBtnRef}
          type="button"
          onClick={() => setCalendarOpen((o) => (o === "right" ? null : "right"))}
          className={calendarBtnClass}
          aria-label="Open calendar"
        >
          <CalendarIcon />
        </button>
      </div>
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
