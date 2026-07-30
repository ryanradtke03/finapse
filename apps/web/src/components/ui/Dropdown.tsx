import { useEffect, useRef, useState } from "react";

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
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

export function Dropdown({ label, value, options, onChange, className = "" }: DropdownProps) {
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

  const selected = options.find((o) => o.value === value);

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
          <span className="text-sm font-semibold text-brand-text">
            {selected?.label ?? "Select…"}
          </span>
          <ChevronIcon open={open} />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1.5 min-w-full overflow-hidden rounded-xl border border-brand-border bg-brand-surface-raised py-1 shadow-2xl">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`block w-full cursor-pointer whitespace-nowrap px-4 py-2 text-left text-sm transition-colors duration-100 hover:bg-brand-border-subtle ${
                option.value === value ? "text-brand-green" : "text-brand-text"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
