export interface TimeFrameOption {
  value: string;
  label: string;
}

/** Relative time-frame presets shared by the Dashboard and Transactions filters. */
export const TIME_FRAME_OPTIONS: TimeFrameOption[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "3m", label: "Last 3 months" },
];

/**
 * Resolve a preset key (e.g. "30d") to a concrete { startDate, endDate }
 * pair as YYYY-MM-DD strings. Relative presets are computed against "now",
 * so a bookmarked `?range=30d` always reflects the last 30 days when opened.
 */
export function presetRange(preset: string): {
  startDate: string;
  endDate: string;
} {
  const end = new Date();
  const start = new Date();
  if (preset === "7d") start.setDate(end.getDate() - 7);
  else if (preset === "30d") start.setDate(end.getDate() - 30);
  else if (preset === "month") start.setDate(1);
  else if (preset === "3m") start.setMonth(end.getMonth() - 3);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: iso(start), endDate: iso(end) };
}
