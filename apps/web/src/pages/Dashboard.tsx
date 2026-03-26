import { useCallback, useEffect, useRef, useState } from "react"
import type { PlaidLinkOnExit, PlaidLinkOnSuccess } from "react-plaid-link"
import { usePlaidLink } from "react-plaid-link"
import { createLinkToken, exchangeToken, syncTransactions } from "../api/plaid"
import logger from "../utils/logger"

type Mode = { type: "new" } | { type: "update"; itemId: string }

interface ConnectBankProps {
  institutionId?: string
  onSuccess?: () => void
}

export default function ConnectBank({ institutionId, onSuccess: onSuccessCallback }: ConnectBankProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const modeRef = useRef<Mode>({ type: "new" })

  const onSuccess = useCallback<PlaidLinkOnSuccess>(async (public_token, metadata) => {
    logger.info("[onSuccess] metadata.accounts", metadata.accounts)
    try {
      const mode = modeRef.current
      if (mode.type === "new") {
        await exchangeToken(public_token, {
          id: metadata.institution!.institution_id,
          name: metadata.institution!.name,
          accounts: metadata.accounts,
        })
        logger.info("Bank connected successfully")
      } else {
        await syncTransactions(mode.itemId)
        logger.info("Accounts synced successfully")
      }
      setLinkToken(null)
      onSuccessCallback?.()
    } catch (err) {
      logger.error("onSuccess failed", { err })
      setError("Something went wrong. Please try again.")
    }
  }, [onSuccessCallback])

  const onExit = useCallback<PlaidLinkOnExit>((err) => {
    if (err) logger.error("Plaid Link exited with error", { err })
    setLinkToken(null)
  }, [])

  const { open, ready } = usePlaidLink({
    token: linkToken ?? "",
    onSuccess,
    onExit,
  })

  useEffect(() => {
    if (linkToken && ready) open()
  }, [linkToken, ready, open])

  const handleConnect = async (instId?: string) => {
    try {
      setLoading(true)
      setError(null)
      const { link_token, mode, item_id } = await createLinkToken(instId)
      logger.info("Link token created", { mode })
      modeRef.current = mode === "update" && item_id
        ? { type: "update", itemId: item_id }
        : { type: "new" }
      setLinkToken(link_token)
    } catch (err) {
      logger.error("createLinkToken failed", { err })
      setError("Failed to initialise Plaid. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Global connect button */}
      <button
        onClick={() => handleConnect()}
        disabled={loading}
        className="bg-[#5fd93a] hover:bg-[#72e84f] text-[#0b0b0b] font-medium text-sm px-5 py-2.5 rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed font-sora"
      >
        {loading ? "connecting..." : "connect bank"}
      </button>

      {/* Hardcoded Chase — replace with real items from API later */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", border: "1px solid #1e1e1e", borderRadius: "8px", background: "#111" }}>
        <span style={{ fontSize: "13px", color: "#e8e8e8", fontFamily: "Sora, sans-serif" }}>Chase</span>
        <button
          onClick={() => handleConnect("ins_56")}
          disabled={loading}
          style={{ fontFamily: "Sora, sans-serif", fontSize: "11px", color: "#555", background: "transparent", border: "1px solid #222", borderRadius: "6px", padding: "5px 12px", cursor: "pointer" }}
        >
          manage accounts
        </button>
      </div>

      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}