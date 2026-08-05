import { useEffect, useRef, useState } from "react";
import {
  TIME_FRAME_OPTIONS,
  detectPeriod,
  presetRange,
  shiftPeriod,
  todayISO,
} from "../../lib/dateRanges";

export interface DateRangeValue {
  /** Preset key for a rolling range (7d/30d/3m). Absent for periods/custom. */
  range?: string;
  /** Concrete range (YYYY-MM-DD) — set for period presets and custom ranges. */
  startDate?: string;
  endDate?: string;
}

interface DateRangeControlProps {
  label: string;
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  includeAllTime?: boolean;
  className?: string;
}

// Period presets navigate; the rest are rolling.
const PERIOD_KEYS = ["today", "week", "month"];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 text-brand-text-secondary transition-transform duration-150 ${open ? "rotate-180" : ""}`}
    >
      <path d="M3 5l4 4 4-4" />
    </svg>
  );
}

function ArrowIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={dir === "left" ? "M10 3L5 8l5 5" : "M6 3l5 5-5 5"} />
    </svg>
  );
}

function fmtDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtNoYear(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function fmtMonth(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

// Human label for the active selection.
function summarize(value: DateRangeValue, includeAllTime: boolean): string {
  if (value.range) {
    return (
      TIME_FRAME_OPTIONS.find((o) => o.value === value.range)?.label ?? "Custom"
    );
  }
  const { startDate: s, endDate: e } = value;
  if (s && e) {
    const type = detectPeriod(s, e);
    if (type === "day") {
      if (s === presetRange("today").startDate) return "Today";
      if (s === shiftPeriod(presetRange("today").startDate, presetRange("today").endDate, -1).startDate)
        return "Yesterday";
      return fmtDate(s);
    }
    if (type === "week") {
      if (s === presetRange("week").startDate) return "This week";
      return `${fmtNoYear(s)} – ${fmtNoYear(e)}`;
    }
    if (type === "month") {
      if (s === presetRange("month").startDate) return "This month";
      return fmtMonth(s);
    }
    return s === e ? fmtDate(s) : `${fmtDate(s)} – ${fmtDate(e)}`;
  }
  if (s) return `From ${fmtDate(s)}`;
  if (e) return `Until ${fmtDate(e)}`;
  return includeAllTime ? "All time" : "Select range";
}

const INPUT_CLASS =
  "w-full rounded-md border border-brand-border-subtle bg-brand-bg px-2 py-1.5 text-sm text-brand-text focus:outline-none [color-scheme:dark]";

/**
 * Time-frame control shared by the Dashboard and Transactions filters. Offers
 * navigable period presets (Today / This week / This month, with ◀ ▶ to step
 * through days/weeks/months), rolling presets (Last 7/30 days, Last 3 months),
 * and a custom From/To range.
 */
export function DateRangeControl({
  label,
  value,
  onChange,
  includeAllTime = false,
  className = "",
}: DateRangeControlProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const period =
    !value.range && value.startDate && value.endDate
      ? detectPeriod(value.startDate, value.endDate)
      : null;
  const navigable = period !== null;

  function isActive(key: string): boolean {
    if (key === "") {
      return !value.range && !value.startDate && !value.endDate;
    }
    if (PERIOD_KEYS.includes(key)) {
      if (value.range) return false;
      const r = presetRange(key);
      return value.startDate === r.startDate && value.endDate === r.endDate;
    }
    return value.range === key;
  }

  const customActive =
    !value.range &&
    !!(value.startDate || value.endDate) &&
    !PERIOD_KEYS.some((k) => isActive(k));

  const presetOptions = includeAllTime
    ? [{ value: "", label: "All time" }, ...TIME_FRAME_OPTIONS]
    : TIME_FRAME_OPTIONS;

  function selectPreset(key: string) {
    if (!key) {
      onChange({});
    } else if (PERIOD_KEYS.includes(key)) {
      const r = presetRange(key);
      onChange({ startDate: r.startDate, endDate: r.endDate });
    } else {
      onChange({ range: key });
    }
    setOpen(false);
  }

  function setCustom(part: "startDate" | "endDate", iso: string) {
    onChange({
      range: undefined,
      startDate: part === "startDate" ? iso || undefined : value.startDate,
      endDate: part === "endDate" ? iso || undefined : value.endDate,
    });
  }

  function step(dir: -1 | 1) {
    if (!value.startDate || !value.endDate) return;
    const r = shiftPeriod(value.startDate, value.endDate, dir);
    onChange({ startDate: r.startDate, endDate: r.endDate });
  }

  // Don't allow navigating a period into the future (past today).
  const nextDisabled =
    navigable && value.startDate && value.endDate
      ? shiftPeriod(value.startDate, value.endDate, 1).startDate > todayISO()
      : false;

  const arrowClass =
    "flex shrink-0 items-center justify-center rounded-xl border border-brand-border-subtle px-2 text-brand-text-secondary transition-colors duration-150 hover:border-brand-border hover:text-brand-text disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex items-stretch gap-1">
      {navigable && (
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Previous"
          className={`${arrowClass} cursor-pointer`}
        >
          <ArrowIcon dir="left" />
        </button>
      )}

      <div ref={containerRef} className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-xl border bg-brand-surface px-4 py-2 text-left transition-colors duration-150 ${
            open
              ? "border-brand-green"
              : "border-brand-border-subtle hover:border-brand-border"
          }`}
        >
          <span className="text-[10px] tracking-wide text-brand-text-secondary uppercase">
            {label}
          </span>
          <span className="flex w-full items-center justify-between gap-3">
            <span className="truncate text-sm font-semibold text-brand-text">
              {summarize(value, includeAllTime)}
            </span>
            <ChevronIcon open={open} />
          </span>
        </button>

        {open && (
          <div className="absolute left-0 top-full z-20 mt-1.5 min-w-full whitespace-nowrap rounded-xl border border-brand-border bg-brand-surface-raised py-1 shadow-2xl">
            {presetOptions.map((option) => {
              const active = isActive(option.value);
              return (
                <button
                  key={option.value || "all"}
                  type="button"
                  onClick={() => selectPreset(option.value)}
                  className={`block w-full cursor-pointer px-4 py-2 text-left text-sm transition-colors duration-100 hover:bg-brand-border-subtle ${
                    active ? "font-semibold text-brand-green" : "text-brand-text"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}

            <div className="my-1 border-t border-brand-border-subtle" />

            <div className="px-4 py-2">
              <p
                className={`mb-2 text-[10px] uppercase tracking-wide ${
                  customActive ? "text-brand-green" : "text-brand-text-secondary"
                }`}
              >
                Custom range
              </p>
              <div className="flex flex-col gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-brand-text-secondary">From</span>
                  <input
                    type="date"
                    value={value.startDate ?? ""}
                    max={value.endDate || undefined}
                    onChange={(e) => setCustom("startDate", e.target.value)}
                    className={INPUT_CLASS}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-brand-text-secondary">To</span>
                  <input
                    type="date"
                    value={value.endDate ?? ""}
                    min={value.startDate || undefined}
                    onChange={(e) => setCustom("endDate", e.target.value)}
                    className={INPUT_CLASS}
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {navigable && (
        <button
          type="button"
          onClick={() => step(1)}
          disabled={nextDisabled}
          aria-label="Next"
          className={`${arrowClass} ${nextDisabled ? "" : "cursor-pointer"}`}
        >
          <ArrowIcon dir="right" />
        </button>
      )}
    </div>
  );
}
