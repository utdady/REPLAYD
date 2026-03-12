const SECOND = 1;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
// Approximate months/years for relative display – we only care about rough buckets
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

function toDate(input: Date | string | number): Date {
  if (input instanceof Date) return input;
  return new Date(input);
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

/**
 * Formats a timestamp as a compact \"time since\" string using the thresholds:
 * - 0–59 seconds  → seconds
 * - 1–59 minutes  → minutes
 * - 1–23 hours    → hours
 * - 1–6 days      → days
 * - 1–4 weeks     → weeks
 * - 1–12 months   → months
 * - 1+ years      → years
 */
export function formatTimeAgo(input: Date | string | number): string {
  const date = toDate(input);
  const now = Date.now();
  const target = date.getTime();

  let diffSeconds = Math.floor((now - target) / 1000);

  // Clamp future times to 0 so we don't show negative durations
  if (diffSeconds < 0) diffSeconds = 0;

  if (diffSeconds < MINUTE) {
    const seconds = diffSeconds;
    const unit = pluralize(seconds, "second", "seconds");
    return `${seconds} ${unit} ago`;
  }

  if (diffSeconds < HOUR) {
    const minutes = Math.floor(diffSeconds / MINUTE);
    const unit = pluralize(minutes, "minute", "minutes");
    return `${minutes} ${unit} ago`;
  }

  if (diffSeconds < DAY) {
    const hours = Math.floor(diffSeconds / HOUR);
    const unit = pluralize(hours, "hour", "hours");
    return `${hours} ${unit} ago`;
  }

  if (diffSeconds < 7 * DAY) {
    const days = Math.floor(diffSeconds / DAY);
    const unit = pluralize(days, "day", "days");
    return `${days} ${unit} ago`;
  }

  if (diffSeconds < 4 * WEEK) {
    const weeks = Math.floor(diffSeconds / WEEK);
    const unit = pluralize(weeks, "week", "weeks");
    return `${weeks} ${unit} ago`;
  }

  if (diffSeconds < 12 * MONTH) {
    const months = Math.floor(diffSeconds / MONTH);
    const unit = pluralize(months, "month", "months");
    return `${months} ${unit} ago`;
  }

  const years = Math.floor(diffSeconds / YEAR);
  const unit = pluralize(years, "year", "years");
  return `${years} ${unit} ago`;
}

