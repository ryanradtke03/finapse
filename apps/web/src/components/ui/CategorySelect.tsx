import { useMemo, useState } from "react";
import {
  getTransactionCategoryLabel,
  isCustomCategory,
  normalizeCustomCategory,
} from "../../lib/transactionCategories";

export interface CategoryOption {
  value: string;
  label: string;
}

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  /** Flat option list. Ignored when `groups` is provided. */
  options?: CategoryOption[];
  /** Grouped options → rendered as <optgroup>s (e.g. the budget picker). */
  groups?: [string, CategoryOption[]][];
  /**
   * The user's already-created custom categories, surfaced under a "Custom"
   * group so they can be reused without retyping (FIN-90).
   */
  customOptions?: CategoryOption[];
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

// Not a real category — selecting it drops the field into free-text mode.
const ADD_CUSTOM = "__add_custom__";

const SELECT_CLASS =
  "w-full rounded-md border border-brand-border-subtle bg-brand-bg px-2 py-2 text-sm text-brand-text focus:outline-none";

/**
 * Category picker shared by the budget and transaction forms. Offers the
 * curated Plaid taxonomy plus a "＋ Custom category…" escape hatch that reveals
 * a text input. Custom input is canonicalized (normalizeCustomCategory) before
 * it leaves the component, so `value` is always something the backend can match
 * on — the visible draft stays human-friendly while the emitted value is the
 * CUSTOM_<SNAKE> token.
 */
export function CategorySelect({
  value,
  onChange,
  options,
  groups,
  customOptions,
  placeholder = "Select a category",
  autoFocus,
  className = "",
}: CategorySelectProps) {
  const knownValues = useMemo(() => {
    const set = new Set<string>();
    if (groups) for (const [, opts] of groups) for (const o of opts) set.add(o.value);
    if (options) for (const o of options) set.add(o.value);
    if (customOptions) for (const o of customOptions) set.add(o.value);
    return set;
  }, [groups, options, customOptions]);

  const [customMode, setCustomMode] = useState(false);
  const [customDraft, setCustomDraft] = useState("");
  const [prevValue, setPrevValue] = useState<string | null>(null);

  // Sync to *external* value changes only (modal open/reset, editing an
  // existing budget). Every internal change also advances prevValue in its
  // handler, so this block never fires for our own edits — which is what keeps
  // it from kicking the user out of custom mode mid-type.
  if (value !== prevValue) {
    setPrevValue(value);
    if (value && !knownValues.has(value) && isCustomCategory(value)) {
      setCustomMode(true);
      setCustomDraft(getTransactionCategoryLabel(value));
    } else {
      setCustomMode(false);
    }
  }

  const handleSelect = (next: string) => {
    if (next === ADD_CUSTOM) {
      setCustomMode(true);
      setCustomDraft("");
      setPrevValue("");
      onChange("");
      return;
    }
    setCustomMode(false);
    setPrevValue(next);
    onChange(next);
  };

  const handleDraft = (raw: string) => {
    setCustomDraft(raw);
    const canonical = normalizeCustomCategory(raw);
    setPrevValue(canonical);
    onChange(canonical);
  };

  // A set value that matches none of the lists and isn't custom — e.g. a
  // legacy primary-level budget ("FOOD_AND_DRINK"). Keep it selectable so
  // editing doesn't silently blank it.
  const showLegacyOption =
    !customMode && !!value && !knownValues.has(value) && !isCustomCategory(value);

  return (
    <div className="flex flex-col gap-2">
      <select
        value={customMode ? ADD_CUSTOM : value}
        onChange={(e) => handleSelect(e.target.value)}
        autoFocus={autoFocus}
        className={`${SELECT_CLASS} ${className}`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {groups
          ? groups.map(([group, opts]) => (
              <optgroup key={group} label={group}>
                {opts.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ))
          : options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
        {customOptions && customOptions.length > 0 && (
          <optgroup label="Custom">
            {customOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
        )}
        {showLegacyOption && (
          <option value={value}>{getTransactionCategoryLabel(value)}</option>
        )}
        <option value={ADD_CUSTOM}>＋ Custom category…</option>
      </select>

      {customMode && (
        <input
          value={customDraft}
          onChange={(e) => handleDraft(e.target.value)}
          placeholder="e.g. Kids, Pets, Vacation fund"
          className={SELECT_CLASS}
          autoFocus
        />
      )}
    </div>
  );
}
