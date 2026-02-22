"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";

export interface DatePickerPopoverProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  align: "start" | "end";
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DatePickerPopover({
  selectedDate,
  onSelectDate,
  onClose,
  anchorRef,
  align,
}: DatePickerPopoverProps) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(selectedDate));
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return;

    const rect = anchor.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const padding = 8;

    let left = rect.left;
    if (align === "end") {
      left = rect.right - panelRect.width;
    }
    left = Math.max(padding, Math.min(left, window.innerWidth - panelRect.width - padding));
    let top = rect.bottom + padding;
    if (top + panelRect.height > window.innerHeight - padding) {
      top = rect.top - panelRect.height - padding;
    }
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }, [anchorRef, align, viewMonth]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const panel = panelRef.current;
      const anchor = anchorRef.current;
      const target = e.target as Node;
      if (panel?.contains(target) || anchor?.contains(target)) return;
      onClose();
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, anchorRef]);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const weeks: Date[][] = [];
  let d = calendarStart;
  while (d <= calendarEnd) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(d, i)));
    d = addDays(d, 7);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        aria-hidden
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="fixed z-50 w-[280px] bg-surface border border-border rounded-card shadow-lg p-3"
        role="dialog"
        aria-modal="true"
        aria-label="Pick a date"
      >
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setViewMonth((m) => subMonths(m, 1))}
            className="p-1.5 rounded text-muted hover:text-white transition-colors"
            aria-label="Previous month"
          >
            &larr;
          </button>
          <span className="text-sm font-mono text-white">
            {format(viewMonth, "MMMM yyyy")}
          </span>
          <button
            type="button"
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            className="p-1.5 rounded text-muted hover:text-white transition-colors"
            aria-label="Next month"
          >
            &rarr;
          </button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 mb-2">
          {DOW.map((day) => (
            <div
              key={day}
              className="text-[10px] font-mono uppercase tracking-wider text-muted text-center py-1"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {weeks.flat().map((date) => {
            const inMonth = isSameMonth(date, viewMonth);
            const selected = isSameDay(date, selectedDate);
            const isTodayDate = isToday(date);
            const isBoth = selected && isTodayDate;
            let cellClass =
              "w-8 h-8 flex items-center justify-center rounded text-sm font-mono transition-colors ";
            if (!inMonth) {
              cellClass += "text-muted2/50 cursor-default";
            } else {
              cellClass += "cursor-pointer ";
              if (isBoth) {
                cellClass += "bg-green text-black";
              } else if (selected) {
                cellClass += "bg-green-dim text-green";
              } else if (isTodayDate) {
                cellClass += "ring-1 ring-green text-green hover:bg-surface3";
              } else {
                cellClass += "text-muted hover:text-white hover:bg-surface3";
              }
            }
            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => inMonth && onSelectDate(date)}
                className={cellClass}
                disabled={!inMonth}
              >
                {format(date, "d")}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
