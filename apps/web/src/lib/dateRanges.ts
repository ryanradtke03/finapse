export interface TimeFrameOption {
  value: string;
  label: string;
}

// Shared time-frame presets. Two kinds:
//   • Period presets (today / week / month) resolve to a concrete calendar
//     span and can be stepped with ◀ ▶ (yesterday, last week, prev month…).
//   • Rolling presets (7d / 30d / 3m) are always relative to "now".
export const TIME_FRAME_OPTIONS: TimeFrameOption[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "7d", label: "Last 7 days" },
  { value: "month", label: "This month" },
  { value: "30d", label: "Last 30 days" },
  { value: "3m", label: "Last 3 months" },
];

// Local-time YYYY-MM-DD (not UTC) so "today" matches the user's calendar day.
function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Parse a YYYY-MM-DD string as a local-midnight Date.
function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Resolve a preset key to a concrete { startDate, endDate } pair (YYYY-MM-DD).
 * Period presets return the full calendar span (week = Sun–Sat, month = 1st–
 * last) so they navigate cleanly; rolling presets count back from today.
 */
export function presetRange(preset: string): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();

  if (preset === "today") {
    return { startDate: iso(now), endDate: iso(now) };
  }
  if (preset === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay()); // back to Sunday
    const end = new Date(start);
    end.setDate(start.getDate() + 6); // Saturday
    return { startDate: iso(start), endDate: iso(end) };
  }
  if (preset === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // last day
    return { startDate: iso(start), endDate: iso(end) };
  }
  if (preset === "7d") {
    const start = new Date(now);
    start.setDate(now.getDate() - 6); // last 7 days incl. today
    return { startDate: iso(start), endDate: iso(now) };
  }
  if (preset === "3m") {
    const start = new Date(now);
    start.setMonth(now.getMonth() - 3);
    return { startDate: iso(start), endDate: iso(now) };
  }
  // Default / "30d": last 30 days.
  const start = new Date(now);
  start.setDate(now.getDate() - 29);
  return { startDate: iso(start), endDate: iso(now) };
}

export type PeriodType = "day" | "week" | "month";

/**
 * If a concrete range is exactly a single day, a full Sun–Sat week, or a whole
 * calendar month, return that period type (so the control can offer ◀ ▶).
 * Arbitrary ranges return null.
 */
export function detectPeriod(
  startDate: string,
  endDate: string,
): PeriodType | null {
  if (startDate === endDate) return "day";
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  const isFirstOfMonth = start.getDate() === 1;
  const lastDay = new Date(
    start.getFullYear(),
    start.getMonth() + 1,
    0,
  ).getDate();
  const isLastOfSameMonth =
    end.getDate() === lastDay &&
    end.getMonth() === start.getMonth() &&
    end.getFullYear() === start.getFullYear();
  if (isFirstOfMonth && isLastOfSameMonth) return "month";

  const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000);
  if (diffDays === 6 && start.getDay() === 0) return "week";

  return null;
}

/** Step a period range forward (+1) or back (-1) by its own unit. */
export function shiftPeriod(
  startDate: string,
  endDate: string,
  dir: -1 | 1,
): { startDate: string; endDate: string } {
  const type = detectPeriod(startDate, endDate);
  const start = parseISO(startDate);

  if (type === "month") {
    const s = new Date(start.getFullYear(), start.getMonth() + dir, 1);
    const e = new Date(s.getFullYear(), s.getMonth() + 1, 0);
    return { startDate: iso(s), endDate: iso(e) };
  }

  const end = parseISO(endDate);
  const step = type === "week" ? 7 : 1;
  const s = new Date(start);
  s.setDate(start.getDate() + dir * step);
  const e = new Date(end);
  e.setDate(end.getDate() + dir * step);
  return { startDate: iso(s), endDate: iso(e) };
}

/** Today as YYYY-MM-DD (local). */
export function todayISO(): string {
  return iso(new Date());
}
