import { useState } from "react";
import type { CreateTransactionInput } from "../api/transactions";
import { CategorySelect, type CategoryOption } from "./ui/CategorySelect";

interface AccountOption {
  value: string;
  label: string;
}

interface TransactionCreateModalProps {
  open: boolean;
  onClose: () => void;
  accounts: AccountOption[];
  categoryOptions: CategoryOption[];
  /** The user's existing custom categories, surfaced for reuse (FIN-90). */
  customCategories?: CategoryOption[];
  onSubmit: (input: CreateTransactionInput) => Promise<void>;
}

type TxnType = "expense" | "income";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
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

export function TransactionCreateModal({
  open,
  onClose,
  accounts,
  categoryOptions,
  customCategories,
  onSubmit,
}: TransactionCreateModalProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TxnType>("expense");
  const [date, setDate] = useState(todayISO());
  const [category, setCategory] = useState("");
  const [accountId, setAccountId] = useState("");
  const [notes, setNotes] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  // Reset the form each time the modal opens (render-time adjustment — same
  // pattern as BudgetModal). Default the account to the only/first one.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setDescription("");
      setAmount("");
      setType("expense");
      setDate(todayISO());
      setCategory("");
      setAccountId(accounts.length === 1 ? accounts[0].value : "");
      setNotes("");
      setTagsInput("");
      setError("");
    }
  }

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation mirrors the server's required fields.
    if (!description.trim()) return setError("Description is required");
    const magnitude = Number(amount);
    if (!amount || Number.isNaN(magnitude) || magnitude <= 0) {
      return setError("Enter an amount greater than 0");
    }
    if (!date) return setError("A date is required");
    if (!category) return setError("Category is required");
    if (!accountId) return setError("Account is required");

    // Signed for the API: expense = positive, income = negative.
    const signed = type === "income" ? -magnitude : magnitude;

    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        accountId,
        amount: Number(signed.toFixed(2)),
        date,
        name: description.trim(),
        category,
        notes: notes.trim() ? notes.trim() : null,
        tags: parseTags(tagsInput),
      });
      onClose();
    } catch (err: unknown) {
      const apiError = err as { error?: string };
      setError(apiError?.error ?? "Couldn't add transaction. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-2xl"
      >
        <h3 className="text-lg font-semibold text-brand-text">Add transaction</h3>
        <p className="mt-1 text-xs text-brand-text-secondary">
          Record a cash or manual transaction not linked to a bank.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <label className="text-xs text-brand-text-secondary">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Farmers market"
              autoFocus
              className="mt-1 w-full rounded-md border border-brand-border-subtle bg-brand-bg px-2 py-2 text-sm text-brand-text placeholder:text-brand-text-secondary focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-brand-text-secondary">Amount</label>
            <div className="mt-1 flex gap-2">
              <div className="flex flex-1 items-center rounded-md border border-brand-border-subtle bg-brand-bg px-2">
                <span className="text-sm text-brand-text-secondary">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent px-1 py-2 text-sm text-brand-text placeholder:text-brand-text-secondary focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1 rounded-md border border-brand-border-subtle bg-brand-bg p-1">
                {(["expense", "income"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`cursor-pointer rounded px-3 py-1.5 text-xs font-medium capitalize transition-colors duration-150 ${
                      type === t
                        ? "bg-brand-green text-brand-bg font-semibold"
                        : "text-brand-text-secondary hover:text-brand-text"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-brand-text-secondary">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-brand-border-subtle bg-brand-bg px-2 py-2 text-sm text-brand-text focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-brand-text-secondary">Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="mt-1 w-full rounded-md border border-brand-border-subtle bg-brand-bg px-2 py-2 text-sm text-brand-text focus:outline-none"
              >
                <option value="" disabled>
                  Select…
                </option>
                {accounts.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-brand-text-secondary">Category</label>
            <div className="mt-1">
              <CategorySelect
                value={category}
                onChange={setCategory}
                options={categoryOptions}
                customOptions={customCategories}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-brand-text-secondary">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional"
              className="mt-1 w-full resize-none rounded-md border border-brand-border-subtle bg-brand-bg px-2 py-2 text-sm text-brand-text placeholder:text-brand-text-secondary focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-brand-text-secondary">
              Tags <span className="text-brand-text-secondary">(comma separated)</span>
            </label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. work, reimbursable"
              className="mt-1 w-full rounded-md border border-brand-border-subtle bg-brand-bg px-2 py-2 text-sm text-brand-text placeholder:text-brand-text-secondary focus:outline-none"
            />
          </div>

          {error && <p className="text-xs text-brand-error">{error}</p>}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-brand-border-subtle px-4 py-2 text-sm text-brand-text-secondary transition-colors duration-200 hover:text-brand-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-brand-bg transition-colors duration-200 hover:bg-brand-green-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Adding…" : "Add transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
