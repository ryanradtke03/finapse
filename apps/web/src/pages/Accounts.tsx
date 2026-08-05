import type { Account, PlaidItem } from "@finapse/types";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  backfillTransactions,
  deleteAccount,
  deleteItem,
  syncTransactions,
} from "../api/plaid";
import { ConnectBankButton } from "../components/ConnectBankButton";
import { DEMO_MODE, SANDBOX_CREDENTIALS } from "../lib/config";
import { Avatar } from "../components/ui/Avatar";
import { useItems } from "../hooks/useItems";
import { invalidateTransactionQueries } from "../hooks/useTransactions";
import logger from "../utils/logger";

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <path d="M7 1v12M1 7h12" />
    </svg>
  );
}

function SyncIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-green">
      <path d="M13.5 8A5.5 5.5 0 013 10.5M2.5 8A5.5 5.5 0 0113 5.5" />
      <path d="M13 3v3h-3M3 13v-3h3" />
    </svg>
  );
}

function BackfillIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-text-secondary">
      <path d="M8 1v8m0 0L5 6m3 3l3-3" />
      <path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 4h12M5 4V2h4l1 2M3 4l1 10h6l1-10" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="shrink-0 text-brand-text-secondary">
      <rect x="1" y="2" width="18" height="12" rx="2" />
      <path d="M1 6h18" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 2l10 10M12 2L2 12" />
    </svg>
  );
}

function formatLastSynced(item: PlaidItem): string {
  if (item.status === "NEEDS_REAUTH") return "Reconnect to resume syncing";
  if (item.status === "DISCONNECTED") return "Disconnected";

  const minutes = Math.round((Date.now() - new Date(item.updatedAt).getTime()) / 60000);
  if (minutes < 1) return "Last synced just now";
  if (minutes < 60) return `Last synced ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Last synced ${hours}h ago`;
  const days = Math.round(hours / 24);
  return `Last synced ${days}d ago`;
}

function formatBalance(value: string | null): string {
  if (value == null) return "—";
  return `$${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function Accounts() {
  const q = useItems();
  const queryClient = useQueryClient();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"sync" | "backfill" | null>(
    null,
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["items"] });

  const handleSync = async (item: PlaidItem) => {
    setPendingId(item.id);
    setPendingAction("sync");
    try {
      await syncTransactions(item.id);
      await invalidate();
    } catch (err) {
      logger.error("Sync failed", { err: String(err) });
    } finally {
      setPendingId(null);
      setPendingAction(null);
    }
  };

  const handleBackfill = async (item: PlaidItem) => {
    const ok = confirm(
      `Backfill ${item.institutionName ?? "this bank"}? This re-fetches its full transaction history from Plaid to repopulate newer fields (detailed category, payment channel, merchant, location) on older transactions.`,
    );
    if (!ok) return;

    setPendingId(item.id);
    setPendingAction("backfill");
    try {
      await backfillTransactions(item.id);
      await invalidate();
      invalidateTransactionQueries(queryClient);
    } catch (err) {
      logger.error("Backfill failed", { err: String(err) });
    } finally {
      setPendingId(null);
      setPendingAction(null);
    }
  };

  // After a successful update-mode relink (ConnectBankButton re-syncs, which
  // flips the item back to ACTIVE server-side), refresh the item list and the
  // transaction views so the badge clears and any newly-synced data shows.
  const afterReconnect = () => {
    invalidate();
    invalidateTransactionQueries(queryClient);
  };

  const handleRemoveBank = async (item: PlaidItem) => {
    const ok = confirm(
      `Remove ${item.institutionName ?? "this bank"}? This deletes all its linked accounts and transactions.`,
    );
    if (!ok) return;

    setPendingId(item.id);
    try {
      await deleteItem(item.id);
      await invalidate();
    } catch (err) {
      logger.error("Remove bank failed", { err: String(err) });
    } finally {
      setPendingId(null);
    }
  };

  const handleRemoveAccount = async (account: Account) => {
    if (!confirm(`Remove ${account.name}?`)) return;
    try {
      await deleteAccount(account.id);
      await invalidate();
    } catch (err) {
      logger.error("Remove account failed", { err: String(err) });
    }
  };

  const items = q.data ?? [];
  const accountCount = items.reduce((sum, i) => sum + i.accounts.length, 0);

  return (
    <div>
      {/* Header + Connect action always render, independent of load/error
          state — otherwise a new user with no accounts (or a failed load)
          would have no way to add a bank. */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-brand-text-secondary">
          {q.isLoading
            ? "Loading accounts…"
            : q.isError
              ? "Couldn't load your accounts"
              : `${items.length} institution${items.length === 1 ? "" : "s"} · ${accountCount} account${accountCount === 1 ? "" : "s"} linked`}
        </p>
        <ConnectBankButton onSuccess={invalidate}>
          <span className="flex items-center gap-1.5">
            <PlusIcon />
            Connect a bank
          </span>
        </ConnectBankButton>
      </div>

      {DEMO_MODE && (
        <div className="mb-6 rounded-xl border border-brand-border-subtle bg-brand-surface p-4 text-sm text-brand-text-secondary">
          This is a Plaid <span className="text-brand-text">Sandbox</span> demo.
          To connect a bank, pick any institution and sign in with{" "}
          <span className="font-mono text-brand-text">
            {SANDBOX_CREDENTIALS.username}
          </span>{" "}
          /{" "}
          <span className="font-mono text-brand-text">
            {SANDBOX_CREDENTIALS.password}
          </span>{" "}
          (use <span className="font-mono text-brand-text">1234</span> for any
          code). No real bank data is used.
        </div>
      )}

      {q.isError && (
        <p className="text-brand-error">
          Couldn't load accounts. You can still connect a new bank above.
        </p>
      )}

      {!q.isLoading && !q.isError && items.length === 0 && (
        <p className="text-brand-text-secondary">
          No banks connected yet — connect one to get started.
        </p>
      )}

      {!q.isLoading && !q.isError && (
        <>
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-brand-border bg-brand-surface p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={item.institutionName ?? "?"}
                      shape="square"
                      variant="palette"
                      size="md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-brand-text">
                          {item.institutionName ?? "Unknown institution"}
                        </h3>
                        {item.status === "NEEDS_REAUTH" && (
                          <span className="rounded-full border border-brand-error-border bg-brand-error-bg px-2 py-0.5 text-xs font-medium text-brand-error">
                            Needs reconnection
                          </span>
                        )}
                        {item.status === "DISCONNECTED" && (
                          <span className="rounded-full bg-brand-surface-raised px-2 py-0.5 text-xs font-medium text-brand-text-secondary">
                            Disconnected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-brand-text-secondary">
                        {formatLastSynced(item)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === "NEEDS_REAUTH" ? (
                      // A broken connection can't sync/backfill until it's
                      // re-authenticated, so offer only Reconnect (Plaid Link
                      // update mode) here. institutionId drives update mode; if
                      // it's somehow missing we fall back to nothing rather than
                      // launching a brand-new connection.
                      item.institutionId && (
                        <ConnectBankButton
                          institutionId={item.institutionId}
                          onSuccess={afterReconnect}
                        >
                          <span className="flex items-center gap-1.5">
                            <SyncIcon />
                            Reconnect
                          </span>
                        </ConnectBankButton>
                      )
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSync(item)}
                          disabled={pendingId === item.id}
                          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-brand-border-subtle bg-brand-surface-raised px-3 py-1.5 text-sm font-medium text-brand-text transition-colors duration-200 hover:border-brand-border disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <SyncIcon />
                          {pendingId === item.id && pendingAction === "sync"
                            ? "Syncing…"
                            : "Sync now"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBackfill(item)}
                          disabled={pendingId === item.id}
                          title="Re-fetch full history to repopulate newer fields on old transactions"
                          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-brand-border-subtle bg-brand-surface-raised px-3 py-1.5 text-sm font-medium text-brand-text transition-colors duration-200 hover:border-brand-border disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <BackfillIcon />
                          {pendingId === item.id && pendingAction === "backfill"
                            ? "Backfilling…"
                            : "Backfill"}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveBank(item)}
                      disabled={pendingId === item.id}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-brand-error-border bg-brand-error-bg px-3 py-1.5 text-sm font-medium text-brand-error transition-colors duration-200 hover:bg-brand-error-bg/80 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <TrashIcon />
                      Remove bank
                    </button>
                  </div>
                </div>

                <div className="flex flex-col">
                  {item.accounts.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between border-t border-brand-border-subtle py-3 first:mt-3"
                    >
                      <div className="flex items-center gap-3">
                        <CardIcon />
                        <div>
                          <p className="text-sm font-medium text-brand-text">
                            {a.name} {a.mask ? `····${a.mask}` : ""}
                          </p>
                          <p className="text-xs text-brand-text-secondary">
                            {a.subtype ?? a.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-brand-text">
                          {formatBalance(a.balanceCurrent)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAccount(a)}
                          title="Remove account"
                          className="cursor-pointer text-brand-text-secondary transition-colors duration-150 hover:text-brand-error"
                        >
                          <XIcon />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
