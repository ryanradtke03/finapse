import { useEffect, useMemo, useRef, useState } from "react";
import {
  getPrimaryCategory,
  getPrimaryCategoryLabel,
} from "../../lib/transactionCategories";

export interface CategoryOption {
  value: string;
  label: string;
  color?: string;
}

interface CategoryFilterDropdownProps {
  label: string;
  values: string[];
  options: CategoryOption[];
  onChange: (values: string[]) => void;
  allLabel?: string;
  className?: string;
}

const OTHER_KEY = "__OTHER__";

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

function DashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 6h6" />
    </svg>
  );
}

// Tri-state checkbox box: filled (check) when all, filled (dash) when some.
function CheckBox({ state }: { state: "all" | "some" | "none" }) {
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
        state === "none"
          ? "border-brand-border-subtle text-transparent"
          : "border-brand-green bg-brand-green text-brand-bg"
      }`}
    >
      {state === "some" ? <DashIcon /> : <CheckIcon />}
    </span>
  );
}

/**
 * Category filter with two levels: broad Plaid primary buckets (Food & Drink,
 * Shopping, …) that select every detailed subcategory under them, each
 * expandable to pick individual subcategories. Selecting a broad group is a
 * shortcut for selecting all its children, so the emitted `values` stay plain
 * detailed categories — no backend changes needed.
 */
export function CategoryFilterDropdown({
  label,
  values,
  options,
  onChange,
  allLabel = "All",
  className = "",
}: CategoryFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
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

  // Bucket the flat options by their broad primary category.
  const groups = useMemo(() => {
    const map = new Map<
      string,
      { key: string; label: string; children: CategoryOption[] }
    >();
    for (const opt of options) {
      const primary = getPrimaryCategory(opt.value);
      const key = primary ?? OTHER_KEY;
      const label = primary ? getPrimaryCategoryLabel(primary) : "Other";
      if (!map.has(key)) map.set(key, { key, label, children: [] });
      map.get(key)!.children.push(opt);
    }
    const list = Array.from(map.values());
    for (const g of list) g.children.sort((a, b) => a.label.localeCompare(b.label));
    // "Other" (custom / subscription / uncategorized) sinks to the bottom.
    list.sort((a, b) =>
      a.key === OTHER_KEY ? 1 : b.key === OTHER_KEY ? -1 : a.label.localeCompare(b.label),
    );
    return list;
  }, [options]);

  const selectedSet = useMemo(() => new Set(values), [values]);
  const allValues = options.map((o) => o.value);
  const allSelected = options.length > 0 && allValues.every((v) => selectedSet.has(v));
  const someSelected = values.length > 0 && !allSelected;

  function groupState(children: CategoryOption[]): "all" | "some" | "none" {
    const sel = children.filter((c) => selectedSet.has(c.value)).length;
    if (sel === 0) return "none";
    if (sel === children.length) return "all";
    return "some";
  }

  function toggleGroup(children: CategoryOption[]) {
    const childValues = children.map((c) => c.value);
    if (groupState(children) === "all") {
      const remove = new Set(childValues);
      onChange(values.filter((v) => !remove.has(v)));
    } else {
      onChange(Array.from(new Set([...values, ...childValues])));
    }
  }

  function toggleChild(value: string) {
    if (selectedSet.has(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  }

  function toggleExpanded(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

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
          <span className="truncate text-sm font-semibold text-brand-text">{summary}</span>
          <ChevronIcon open={open} />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1.5 max-h-96 min-w-full overflow-y-auto whitespace-nowrap rounded-xl border border-brand-border bg-brand-surface-raised py-1 shadow-2xl">
          {/* Select all / clear */}
          <button
            type="button"
            onClick={() => onChange(allSelected ? [] : allValues)}
            className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-left text-sm text-brand-text transition-colors duration-100 hover:bg-brand-border-subtle"
          >
            <CheckBox state={allSelected ? "all" : someSelected ? "some" : "none"} />
            {allLabel}
          </button>
          <div className="my-1 border-t border-brand-border-subtle" />

          {groups.map((group) => {
            const state = groupState(group.children);
            const isOpen = expanded.has(group.key);
            return (
              <div key={group.key}>
                {/* Broad group header: chevron expands, rest toggles the group */}
                <div className="flex items-center hover:bg-brand-border-subtle">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(group.key)}
                    aria-label={isOpen ? "Collapse" : "Expand"}
                    className="cursor-pointer py-2 pl-3 pr-1 text-brand-text-secondary"
                  >
                    <ChevronIcon open={isOpen} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.children)}
                    className="flex flex-1 cursor-pointer items-center gap-2.5 py-2 pr-4 text-left text-sm font-medium text-brand-text"
                  >
                    <CheckBox state={state} />
                    {group.label}
                    <span className="ml-1 text-xs font-normal text-brand-text-secondary">
                      ({group.children.length})
                    </span>
                  </button>
                </div>

                {/* Detailed children */}
                {isOpen &&
                  group.children.map((child) => (
                    <button
                      key={child.value}
                      type="button"
                      onClick={() => toggleChild(child.value)}
                      className="flex w-full cursor-pointer items-center gap-2.5 py-1.5 pl-12 pr-4 text-left text-sm text-brand-text transition-colors duration-100 hover:bg-brand-border-subtle"
                    >
                      <CheckBox state={selectedSet.has(child.value) ? "all" : "none"} />
                      {child.color && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: child.color }}
                        />
                      )}
                      {child.label}
                    </button>
                  ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
