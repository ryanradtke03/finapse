import { useEffect, useRef, useState } from "react";
import { TIME_FRAME_OPTIONS } from "../../lib/dateRanges";

export interface DateRangeValue {
  /** Preset key (e.g. "30d"). Mutually exclusive with start/end. */
  range?: string;
  /** Explicit custom range (YYYY-MM-DD). Set when `range` is absent. */
  startDate?: string;
  endDate?: string;
}

interface DateRangeControlProps {
  label: string;
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  /** Show an "All time" option (no range at all). Defaults to false. */
  includeAllTime?: boolean;
  className?: string;
}

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

// "2026-08-06" → "Aug 6, 2026" (parsed as local midnight to avoid off-by-one).
function fmtDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function summarize(
  value: DateRangeValue,
  includeAllTime: boolean,
): string {
  if (value.range) {
    return (
      TIME_FRAME_OPTIONS.find((o) => o.value === value.range)?.label ??
      "Custom"
    );
  }
  const { startDate: s, endDate: e } = value;
  if (s && e) return s === e ? fmtDate(s) : `${fmtDate(s)} – ${fmtDate(e)}`;
  if (s) return `From ${fmtDate(s)}`;
  if (e) return `Until ${fmtDate(e)}`;
  return includeAllTime ? "All time" : "Select range";
}

const INPUT_CLASS =
  "w-full rounded-md border border-brand-border-subtle bg-brand-bg px-2 py-1.5 text-sm text-brand-text focus:outline-none [color-scheme:dark]";

/**
 * Time-frame control shared by the Dashboard and Transactions filters. Offers
 * relative presets plus a custom From/To range, and always displays the range
 * that's actually active — including a single clicked day.
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

  const customActive = !value.range && !!(value.startDate || value.endDate);

  const presetOptions = includeAllTime
    ? [{ value: "", label: "All time" }, ...TIME_FRAME_OPTIONS]
    : TIME_FRAME_OPTIONS;

  function selectPreset(key: string) {
    // Empty key = "All time" (no range, no dates).
    onChange({ range: key || undefined, startDate: undefined, endDate: undefined });
    setOpen(false);
  }

  function setCustom(part: "startDate" | "endDate", iso: string) {
    onChange({
      range: undefined,
      startDate: part === "startDate" ? iso || undefined : value.startDate,
      endDate: part === "endDate" ? iso || undefined : value.endDate,
    });
  }

  return (
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
            const active = (value.range ?? "") === option.value && !customActive;
            return (
              <button
                key={option.value || "all"}
                type="button"
                onClick={() => selectPreset(option.value)}
                className={`block w-full cursor-pointer px-4 py-2 text-left text-sm transition-colors duration-100 hover:bg-brand-border-subtle ${
                  active
                    ? "font-semibold text-brand-green"
                    : "text-brand-text"
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
  );
}
