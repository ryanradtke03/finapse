import type { Transaction } from "@finapse/types";
import { useState } from "react";
import { CategoryBadge } from "./ui/CategoryBadge";
import { getEffectiveCategory } from "../lib/transactionCategories";

interface AccountInfo {
  institutionName: string;
  mask: string | null;
}

interface TransactionDetailPanelProps {
  transaction: Transaction;
  account?: AccountInfo;
  categoryOptions: { value: string; label: string }[];
  onClose: () => void;
  onRecategorize: (category: string) => Promise<void>;
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 2l12 12M14 2L2 14" />
    </svg>
  );
}

function formatMoney(value: number): string {
  return `$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function capitalizeFirst(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-t border-brand-border-subtle py-3 first:border-0">
      <span className="text-sm text-brand-text-secondary">{label}</span>
      <span className="text-sm font-medium text-brand-text">{value}</span>
    </div>
  );
}

export function TransactionDetailPanel({
  transaction: t,
  account,
  categoryOptions,
  onClose,
  onRecategorize,
}: TransactionDetailPanelProps) {
  const [editing, setEditing] = useState(false);
  const [choice, setChoice] = useState(() => getEffectiveCategory(t));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const amount = Number(t.amount);
  const isIncome = amount < 0;
  const effectiveCategory = getEffectiveCategory(t);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await onRecategorize(choice);
      setEditing(false);
    } catch {
      setError("Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sticky top-6 flex w-96 shrink-0 flex-col rounded-xl border border-brand-border bg-brand-surface p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-semibold text-brand-text">Transaction detail</h3>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer text-brand-text-secondary transition-colors duration-150 hover:text-brand-text"
        >
          <XIcon />
        </button>
      </div>

      <h2 className="text-xl font-bold text-brand-text">
        {t.merchantName ?? t.name}
      </h2>
      <p
        className={`mt-1 text-3xl font-bold ${isIncome ? "text-brand-green" : "text-brand-error"}`}
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
        <DetailRow label="Category" value={<CategoryBadge category={effectiveCategory} />} />
        <DetailRow
          label="Account"
          value={account ? `${account.institutionName}${account.mask ? ` ··${account.mask}` : ""}` : "—"}
        />
        <DetailRow
          label="Payment channel"
          value={t.paymentChannel ? capitalizeFirst(t.paymentChannel) : "—"}
        />
        <DetailRow label="Status" value={t.pending ? "Pending" : "Posted"} />
        <DetailRow label="Merchant ID" value={t.merchantEntityId ?? "—"} />
        <DetailRow label="Transaction ID" value={t.plaidTransactionId} />
        <DetailRow label="Location" value={t.location ?? "—"} />
      </div>

      <div className="mt-6">
        {editing ? (
          <div className="flex flex-col gap-2">
            <select
              value={choice}
              onChange={(e) => setChoice(e.target.value)}
              className="w-full rounded-md border border-brand-border-subtle bg-brand-bg px-2 py-2 text-sm text-brand-text focus:outline-none"
            >
              {categoryOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {error && <p className="text-xs text-brand-error">{error}</p>}
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
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="w-full cursor-pointer rounded-lg border border-brand-border-subtle py-2.5 text-sm font-semibold text-brand-green transition-colors duration-200 hover:bg-brand-green-muted"
          >
            Recategorize
          </button>
        )}
      </div>
    </div>
  );
}
