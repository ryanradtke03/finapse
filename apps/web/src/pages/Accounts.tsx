import type { Account, PlaidItem } from "@finapse/types";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { deleteAccount, deleteItem, syncTransactions } from "../api/plaid";
import { ConnectBankButton } from "../components/ConnectBankButton";
import { Avatar } from "../components/ui/Avatar";
import { useItems } from "../hooks/useItems";
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
  if (item.status === "NEEDS_REAUTH") return "Needs reconnection";
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

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["items"] });

  const handleSync = async (item: PlaidItem) => {
    setPendingId(item.id);
    try {
      await syncTransactions(item.id);
      await invalidate();
    } catch (err) {
      logger.error("Sync failed", { err: String(err) });
    } finally {
      setPendingId(null);
    }
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
      {q.isLoading && <p className="text-brand-text-secondary">Loading…</p>}
      {q.isError && (
        <p className="text-brand-error">Couldn't load accounts.</p>
      )}

      {!q.isLoading && !q.isError && (
        <>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-brand-text-secondary">
              {items.length} institution{items.length === 1 ? "" : "s"} ·{" "}
              {accountCount} account{accountCount === 1 ? "" : "s"} linked
            </p>
            <ConnectBankButton onSuccess={invalidate}>
              <span className="flex items-center gap-1.5">
                <PlusIcon />
                Connect a bank
              </span>
            </ConnectBankButton>
          </div>

          {items.length === 0 && (
            <p className="text-brand-text-secondary">
              No banks connected yet.
            </p>
          )}

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
                      <h3 className="font-semibold text-brand-text">
                        {item.institutionName ?? "Unknown institution"}
                      </h3>
                      <p className="text-xs text-brand-text-secondary">
                        {formatLastSynced(item)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSync(item)}
                      disabled={pendingId === item.id}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-brand-border-subtle bg-brand-surface-raised px-3 py-1.5 text-sm font-medium text-brand-text transition-colors duration-200 hover:border-brand-border disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <SyncIcon />
                      {pendingId === item.id ? "Syncing…" : "Sync now"}
                    </button>
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
