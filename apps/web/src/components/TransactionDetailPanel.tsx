import type { Transaction } from "@finapse/types";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CategoryBadge } from "./ui/CategoryBadge";
import { CategorySelect, type CategoryOption } from "./ui/CategorySelect";
import { getEffectiveCategory } from "../lib/transactionCategories";

interface AccountInfo {
  institutionName: string;
  mask: string | null;
}

export interface TransactionEditPatch {
  category?: string;
  notes?: string | null;
  tags?: string[];
}

interface TransactionDetailPanelProps {
  /** Controls the slide-in/out. The panel stays mounted either way. */
  open: boolean;
  /** The selected transaction, or null while nothing is selected / still loading. */
  transaction: Transaction | null;
  /** True while the transaction is being fetched (first open, before data arrives). */
  loading?: boolean;
  account?: AccountInfo;
  categoryOptions: CategoryOption[];
  /** The user's existing custom categories, surfaced for reuse (FIN-90). */
  customCategories?: CategoryOption[];
  onClose: () => void;
  onSave: (patch: TransactionEditPatch) => Promise<void>;
  onDelete?: () => Promise<void>;
}

function XIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M2 2l12 12M14 2L2 14" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
      <path d="M10.5 5.5V4A1.5 1.5 0 009 2.5H4A1.5 1.5 0 002.5 4v5A1.5 1.5 0 004 10.5h1.5" />
    </svg>
  );
}

function formatMoney(value: number): string {
  return `$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function capitalizeFirst(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function parseTags(input: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input.split(",")) {
    const tag = raw.trim();
    if (tag && !seen.has(tag.toLowerCase())) {
      seen.add(tag.toLowerCase());
      out.push(tag);
    }
  }
  return out;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-brand-border-subtle py-3 first:border-0">
      <span className="text-sm text-brand-text-secondary">{label}</span>
      <span className="min-w-0 truncate text-right text-sm font-medium text-brand-text">
        {value}
      </span>
    </div>
  );
}

/**
 * Long Plaid identifiers blow out a fixed-width column, so IDs get their own
 * stacked row: label on top, value below in a bounded block that wraps
 * (font-mono text-xs break-all) with a copy-to-clipboard affordance.
 */
function MonoDetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  return (
    <div className="flex flex-col gap-1 border-t border-brand-border-subtle py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-brand-text-secondary">{label}</span>
        {value && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex shrink-0 cursor-pointer items-center gap-1 text-xs text-brand-text-secondary transition-colors duration-150 hover:text-brand-text"
          >
            <CopyIcon />
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
      <span className="font-mono text-xs break-all text-brand-text">
        {value ?? "—"}
      </span>
    </div>
  );
}

export function TransactionDetailPanel({
  open,
  transaction,
  loading = false,
  account,
  categoryOptions,
  customCategories,
  onClose,
  onSave,
  onDelete,
}: TransactionDetailPanelProps) {
  // Keep the last non-null transaction so content stays visible during the
  // slide-out animation (the panel is always mounted).
  const [displayed, setDisplayed] = useState<Transaction | null>(transaction);
  const [prevId, setPrevId] = useState<string | undefined>(transaction?.id);

  const [editing, setEditing] = useState(false);
  const [choice, setChoice] = useState(() =>
    transaction ? getEffectiveCategory(transaction) : "",
  );
  const [notes, setNotes] = useState(transaction?.notes ?? "");
  const [tagsInput, setTagsInput] = useState(
    transaction?.tags.join(", ") ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Render-time state sync (same pattern as BudgetModal/AuthModal): when a new
  // transaction is selected, reset the edit form; when the same one arrives
  // with fresh data (e.g. after a save), just refresh the displayed copy.
  if (transaction) {
    if (transaction.id !== prevId) {
      setPrevId(transaction.id);
      setDisplayed(transaction);
      setEditing(false);
      setChoice(getEffectiveCategory(transaction));
      setNotes(transaction.notes ?? "");
      setTagsInput(transaction.tags.join(", "));
      setError("");
    } else if (transaction !== displayed) {
      setDisplayed(transaction);
    }
  }

  // Escape closes the panel while it's open.
  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  // Lock body scroll while the panel is open so scrolling stays inside it.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const t = displayed;
  const initialCategory = t ? getEffectiveCategory(t) : "";
  const initialNotes = t?.notes ?? "";
  const initialTags = t?.tags.join(", ") ?? "";

  const amount = t ? Number(t.amount) : 0;
  const isIncome = amount < 0;
  const canDelete = t?.source === "MANUAL" && !!onDelete;

  const startEditing = () => {
    setChoice(initialCategory);
    setNotes(initialNotes);
    setTagsInput(initialTags);
    setError("");
    setEditing(true);
  };

  const handleSave = async () => {
    if (!t) return;
    setSaving(true);
    setError("");

    const patch: TransactionEditPatch = {};
    if (choice !== initialCategory) patch.category = choice;
    if (notes !== initialNotes)
      patch.notes = notes.trim() ? notes.trim() : null;
    const parsedTags = parseTags(tagsInput);
    if (parsedTags.join(",") !== t.tags.join(",")) patch.tags = parsedTags;

    if (Object.keys(patch).length === 0) {
      setEditing(false);
      setSaving(false);
      return;
    }

    try {
      await onSave(patch);
      setEditing(false);
    } catch {
      setError("Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm("Delete this transaction? This can't be undone.")) return;
    setDeleting(true);
    setError("");
    try {
      await onDelete();
    } catch {
      setError("Couldn't delete. Try again.");
      setDeleting(false);
    }
  };

  return createPortal(
    <>
      {/* Backdrop — click to close. Always mounted; fades and stops
          intercepting clicks when closed so the list stays interactive. */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Slide-over panel — fixed to the right edge, overlaying the list. */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-brand-border bg-brand-surface shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header — pinned, shows the actual merchant/transaction name. */}
        <div className="flex items-start justify-between gap-3 border-b border-brand-border-subtle p-6">
          <div className="min-w-0">
            <p className="text-[10px] tracking-wide text-brand-text-secondary uppercase">
              Transaction
            </p>
            <h2 className="truncate text-lg font-semibold text-brand-text">
              {t ? (t.merchantName ?? t.name) : "—"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="mt-0.5 shrink-0 cursor-pointer text-brand-text-secondary transition-colors duration-150 hover:text-brand-text"
          >
            <XIcon />
          </button>
        </div>

        {/* Scrollable body — its own overflow, independent of the list. */}
        <div className="flex-1 overflow-y-auto p-6">
          {!t && loading && (
            <p className="text-sm text-brand-text-secondary">Loading…</p>
          )}

          {t && (
            <>
              <p
                className={`text-3xl font-bold ${isIncome ? "text-brand-green" : "text-brand-error"}`}
              >
                {isIncome ? "+" : "-"}
                {formatMoney(amount)}
              </p>

              <div className="mt-4 flex flex-col">
                <DetailRow
                  label="Date"
                  value={new Date(t.date).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                />
                <DetailRow
                  label="Category"
                  value={<CategoryBadge category={initialCategory} />}
                />
                <DetailRow
                  label="Account"
                  value={
                    account
                      ? `${account.institutionName}${account.mask ? ` ··${account.mask}` : ""}`
                      : "—"
                  }
                />
                <DetailRow
                  label="Payment channel"
                  value={
                    t.paymentChannel ? capitalizeFirst(t.paymentChannel) : "—"
                  }
                />
                <DetailRow
                  label="Status"
                  value={t.pending ? "Pending" : "Posted"}
                />
                <DetailRow label="Location" value={t.location ?? "—"} />
                <MonoDetailRow
                  label="Merchant ID"
                  value={t.merchantEntityId ?? null}
                />
                <MonoDetailRow
                  label="Transaction ID"
                  value={t.plaidTransactionId}
                />
              </div>

              {/* Notes + tags (read view) */}
              {!editing && (
                <div className="mt-4 flex flex-col gap-3 border-t border-brand-border-subtle pt-4">
                  <div>
                    <p className="text-xs text-brand-text-secondary">Notes</p>
                    <p className="mt-1 text-sm text-brand-text">
                      {t.notes ? (
                        t.notes
                      ) : (
                        <span className="text-brand-text-secondary">—</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-brand-text-secondary">Tags</p>
                    {t.tags.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {t.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-brand-surface-raised px-2.5 py-0.5 text-xs text-brand-text"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-brand-text-secondary">
                        —
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6">
                {editing ? (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-xs text-brand-text-secondary">
                        Category
                      </label>
                      <div className="mt-1">
                        <CategorySelect
                          value={choice}
                          onChange={setChoice}
                          options={categoryOptions}
                          customOptions={customCategories}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-brand-text-secondary">
                        Notes
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Add a note…"
                        className="mt-1 w-full resize-none rounded-md border border-brand-border-subtle bg-brand-bg px-2 py-2 text-sm text-brand-text placeholder:text-brand-text-secondary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-brand-text-secondary">
                        Tags{" "}
                        <span className="text-brand-text-secondary">
                          (comma separated)
                        </span>
                      </label>
                      <input
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        placeholder="e.g. work, reimbursable"
                        className="mt-1 w-full rounded-md border border-brand-border-subtle bg-brand-bg px-2 py-2 text-sm text-brand-text placeholder:text-brand-text-secondary focus:outline-none"
                      />
                    </div>
                    {error && (
                      <p className="text-xs text-brand-error">{error}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 cursor-pointer rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-brand-bg transition-colors duration-200 hover:bg-brand-green-hover disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {saving ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        disabled={saving}
                        className="cursor-pointer rounded-lg border border-brand-border-subtle px-4 py-2 text-sm text-brand-text-secondary transition-colors duration-200 hover:text-brand-text"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={startEditing}
                      className="w-full cursor-pointer rounded-lg border border-brand-border-subtle py-2.5 text-sm font-semibold text-brand-green transition-colors duration-200 hover:bg-brand-green-muted"
                    >
                      Edit
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="w-full cursor-pointer rounded-lg border border-brand-error-border bg-brand-error-bg py-2.5 text-sm font-semibold text-brand-error transition-colors duration-200 hover:bg-brand-error-bg/80 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deleting ? "Deleting…" : "Delete transaction"}
                      </button>
                    )}
                    {error && (
                      <p className="text-xs text-brand-error">{error}</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </>,
    document.body,
  );
}
