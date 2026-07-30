import { useCallback, useEffect, useRef, useState } from "react";
import type { PlaidLinkOnExit, PlaidLinkOnSuccess } from "react-plaid-link";
import { usePlaidLink } from "react-plaid-link";
import { createLinkToken, exchangeToken, syncTransactions } from "../api/plaid";
import logger from "../utils/logger";

type Mode = { type: "new" } | { type: "update"; itemId: string };

interface ConnectBankButtonProps {
  institutionId?: string;
  onSuccess?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function ConnectBankButton({
  institutionId,
  onSuccess: onSuccessCallback,
  className = "",
  children,
}: ConnectBankButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modeRef = useRef<Mode>({ type: "new" });

  const onSuccess = useCallback<PlaidLinkOnSuccess>(
    async (public_token, metadata) => {
      try {
        const mode = modeRef.current;
        if (mode.type === "new") {
          await exchangeToken(public_token, {
            id: metadata.institution!.institution_id,
            name: metadata.institution!.name,
            accounts: metadata.accounts,
          });
          logger.info("Bank connected successfully");
        } else {
          await syncTransactions(mode.itemId);
          logger.info("Accounts synced successfully");
        }
        setLinkToken(null);
        onSuccessCallback?.();
      } catch (err) {
        logger.error("onSuccess failed", { err: String(err) });
        setError("Something went wrong. Please try again.");
      }
    },
    [onSuccessCallback],
  );

  const onExit = useCallback<PlaidLinkOnExit>((err) => {
    if (err) logger.error("Plaid Link exited with error", { err: String(err) });
    setLinkToken(null);
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken ?? "",
    onSuccess,
    onExit,
  });

  useEffect(() => {
    if (linkToken && ready) open();
  }, [linkToken, ready, open]);

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);
      const { link_token, mode, item_id } = await createLinkToken(institutionId);
      modeRef.current =
        mode === "update" && item_id ? { type: "update", itemId: item_id } : { type: "new" };
      setLinkToken(link_token);
    } catch (err) {
      logger.error("createLinkToken failed", { err: String(err) });
      setError("Failed to initialize Plaid. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleConnect}
        disabled={loading}
        className={`cursor-pointer rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-brand-bg transition-colors duration-200 hover:bg-brand-green-hover disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        {loading ? "Connecting…" : children}
      </button>
      {error && <p className="text-xs text-brand-error">{error}</p>}
    </div>
  );
}
