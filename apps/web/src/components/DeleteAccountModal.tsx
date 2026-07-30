import { useState } from "react";

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  userEmail: string;
}

export function DeleteAccountModal({
  open,
  onClose,
  onConfirm,
  userEmail,
}: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  // Reset the typed confirmation each time the modal opens — render-time
  // state adjustment, not an effect (same pattern as AuthModal/BudgetModal).
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setConfirmText("");
      setError("");
    }
  }

  if (!open) return null;

  const canConfirm = confirmText.trim().toLowerCase() === userEmail.toLowerCase();

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setSubmitting(true);
    setError("");
    try {
      await onConfirm();
    } catch (err: unknown) {
      const apiError = err as { error?: string };
      setError(apiError?.error ?? "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={submitting ? undefined : onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-96 rounded-2xl border border-brand-error/40 bg-brand-surface p-6 shadow-2xl"
      >
        <h3 className="text-lg font-semibold text-brand-error">Delete account</h3>
        <p className="mt-2 text-sm text-brand-text-secondary">
          This permanently deletes your linked banks, transactions, and
          budgets. This cannot be undone.
        </p>

        <label className="mt-4 block text-xs text-brand-text-secondary">
          Type <span className="font-semibold text-brand-text">{userEmail}</span> to confirm
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          autoFocus
          disabled={submitting}
          className="mt-1 w-full rounded-md border border-brand-border-subtle bg-brand-bg px-2 py-2 text-sm text-brand-text focus:outline-none disabled:opacity-50"
        />

        {error && <p className="mt-2 text-xs text-brand-error">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="cursor-pointer rounded-lg border border-brand-border-subtle px-4 py-2 text-sm text-brand-text-secondary transition-colors duration-200 hover:text-brand-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || submitting}
            className="cursor-pointer rounded-lg bg-brand-error px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Deleting…" : "Delete account"}
          </button>
        </div>
      </div>
    </div>
  );
}
