import { useEffect, useRef, useState } from "react";

export interface MultiSelectOption {
  value: string;
  label: string;
  color?: string;
}

interface MultiSelectDropdownProps {
  label: string;
  values: string[];
  options: MultiSelectOption[];
  onChange: (values: string[]) => void;
  allLabel?: string;
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

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6l3 3 5-6" />
    </svg>
  );
}

// Indeterminate state for "select all" when only some options are selected.
function DashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 6h6" />
    </svg>
  );
}

export function MultiSelectDropdown({
  label,
  values,
  options,
  onChange,
  allLabel = "All",
  className = "",
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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

  function toggle(value: string) {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  }

  const allValues = options.map((o) => o.value);
  const allSelected =
    options.length > 0 && allValues.every((v) => values.includes(v));
  const someSelected = values.length > 0 && !allSelected;

  const summary =
    values.length === 0 || allSelected ? allLabel : `${values.length} selected`;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-xl border bg-brand-surface px-4 py-2 text-left transition-colors duration-150 ${
          open ? "border-brand-green" : "border-brand-border-subtle hover:border-brand-border"
        }`}
      >
        <span className="text-[10px] tracking-wide text-brand-text-secondary uppercase">
          {label}
        </span>
        <span className="flex w-full items-center justify-between gap-3">
          <span className="text-sm font-semibold text-brand-text">{summary}</span>
          <ChevronIcon open={open} />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1.5 max-h-80 min-w-full overflow-y-auto rounded-xl border border-brand-border bg-brand-surface-raised py-1 shadow-2xl">
          <button
            type="button"
            onClick={() => onChange(allSelected ? [] : allValues)}
            className="flex w-full cursor-pointer items-center gap-2.5 whitespace-nowrap px-4 py-2 text-left text-sm text-brand-text transition-colors duration-100 hover:bg-brand-border-subtle"
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                allSelected || someSelected
                  ? "border-brand-green bg-brand-green text-brand-bg"
                  : "border-brand-border-subtle text-transparent"
              }`}
            >
              {someSelected ? <DashIcon /> : <CheckIcon />}
            </span>
            {allLabel}
          </button>
          <div className="my-1 border-t border-brand-border-subtle" />
          {options.map((option) => {
            const checked = values.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggle(option.value)}
                className="flex w-full cursor-pointer items-center gap-2.5 whitespace-nowrap px-4 py-2 text-left text-sm text-brand-text transition-colors duration-100 hover:bg-brand-border-subtle"
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    checked
                      ? "border-brand-green bg-brand-green text-brand-bg"
                      : "border-brand-border-subtle text-transparent"
                  }`}
                >
                  <CheckIcon />
                </span>
                {option.color && (
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                )}
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
