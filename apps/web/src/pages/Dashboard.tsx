import { useState } from "react";
import type { TransactionFilters } from "../api/transactions";
import { useItems } from "../hooks/useItems";
import {
  useTransactions,
  useTransactionSummary,
} from "../hooks/useTransactions";

// time-frame presets → concrete date range
function presetRange(preset: string): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  if (preset === "7d") start.setDate(end.getDate() - 7);
  else if (preset === "30d") start.setDate(end.getDate() - 30);
  else if (preset === "month") start.setDate(1);
  else if (preset === "3m") start.setMonth(end.getMonth() - 3);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: iso(start), endDate: iso(end) };
}

export default function Dashboard() {
  const [filters, setFilters] = useState<TransactionFilters>(
    presetRange("30d"),
  );
  const [chartMode, setChartMode] = useState<"total" | "category" | "avg">(
    "total",
  );

  const items = useItems();
  const summary = useTransactionSummary(filters);
  const list = useTransactions({ ...filters, limit: 10 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accounts = items.data?.flatMap((i: any) => i.accounts) ?? [];
  const categories = summary.data?.byCategory ?? [];

  function setFilter<K extends keyof TransactionFilters>(
    key: K,
    value: TransactionFilters[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  }

  function applyPreset(preset: string) {
    setFilters((prev) => ({ ...prev, ...presetRange(preset) }));
  }

  const spent = summary.data?.totalSpent ?? 0;
  const income = summary.data?.totalIncome ?? 0;
  const net = income - spent; // client-side until backend returns `net`

  const days =
    filters.startDate && filters.endDate
      ? Math.max(
          1,
          (new Date(filters.endDate).getTime() -
            new Date(filters.startDate).getTime()) /
            86400000,
        )
      : 30;

  return (
    <div
      style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}
    >
      {/* filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <select
          value={filters.accountId ?? ""}
          onChange={(e) => setFilter("accountId", e.target.value)}
        >
          <option value="">All accounts</option>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
          {accounts.map((a: any) => (
            <option key={a.id} value={a.id}>
              {a.name} {a.mask ? `··${a.mask}` : ""}
            </option>
          ))}
        </select>

        <select
          defaultValue="30d"
          onChange={(e) => applyPreset(e.target.value)}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="month">This month</option>
          <option value="3m">Last 3 months</option>
        </select>

        <select
          value={filters.category ?? ""}
          onChange={(e) => setFilter("category", e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.category} value={c.category}>
              {c.category}
            </option>
          ))}
        </select>
      </div>

      {/* summary strip */}
      <div style={{ display: "flex", gap: 12 }}>
        {[
          ["Spending", spent],
          ["Income", income],
          ["Net", net],
        ].map(([label, value]) => (
          <div
            key={label as string}
            style={{
              flex: 1,
              padding: 16,
              border: "1px solid #ccc",
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.6 }}>{label}</div>
            <div style={{ fontSize: 24 }}>${Number(value).toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* chart-mode toggle + graph area */}
      <div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          {(["total", "category", "avg"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setChartMode(m)}
              style={{ fontWeight: chartMode === m ? 700 : 400 }}
            >
              {m === "total"
                ? "Total"
                : m === "category"
                  ? "By category"
                  : "Avg / day"}
            </button>
          ))}
        </div>

        <div
          style={{ padding: 16, border: "1px dashed #ccc", borderRadius: 8 }}
        >
          {chartMode === "total" && (
            <p>[ spending-over-time chart — needs byDay from backend ]</p>
          )}
          {chartMode === "category" &&
            categories.map((c) => (
              <div
                key={c.category}
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <span>{c.category}</span>
                <span>${c.total.toFixed(2)}</span>
              </div>
            ))}
          {chartMode === "avg" && (
            <p>Avg spend / day: ${(spent / days).toFixed(2)}</p>
          )}
        </div>
      </div>

      {/* recent transactions */}
      <div>
        <h3>Recent transactions</h3>
        {list.isLoading && <p>Loading…</p>}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
        {list.data?.transactions.map((t: any) => (
          <div
            key={t.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "4px 0",
            }}
          >
            <span>{t.merchantName ?? t.name}</span>
            <span>${Number(t.amount).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
// import { useCallback, useEffect, useRef, useState } from "react"
// import type { PlaidLinkOnExit, PlaidLinkOnSuccess } from "react-plaid-link"
// import { usePlaidLink } from "react-plaid-link"
// import { createLinkToken, exchangeToken, syncTransactions } from "../api/plaid"

// // import { useState } from "react";
// // import { useItems } from "../hooks/useItems";

// import logger from "../utils/logger"

// type Mode = { type: "new" } | { type: "update"; itemId: string }

// interface ConnectBankProps {
//   institutionId?: string
//   onSuccess?: () => void
// }

// // export default function Dashboard() {
// //   const { data: items, isLoading } = useItems()
// //   const [expandedId, setExpandedId] = useState<string | null>(null)

// //   if (isLoading) return <div>Loading...</div>
// //   if (!items?.length) return <div>No accounts connected yet</div>

// //   return (
// //     <div>
// //       <div className="mt-8 flex justify-center items-center">

// //         {/* Modal Container */}
// //         <div className="bg-brand-tab-bg border-2 border-brand-text-secondary rounded-2xl flex flex-col justify-center items-center">

// //           {/* Header */}
// //           <div className="text-brand-text flex flex-row border-b border-b-brand-text-secondary justify-between min-w-100 py-2">
// //             <div className="pl-4">Connected Accounts</div>
// //             <button className="pr-4">+ Add Institution</button>
// //           </div>

// //           {/* Item Card List */}
// //           <div className="flex flex-col text-brand-text m-4 gap-2">
// //             {items.map(item => (
// //               <div key={item.id} className="flex flex-col bg-brand-bg border border-brand-text-secondary rounded-xl min-w-[460px]">

// //                 {/* Item Card Row */}
// //                 <div
// //                   className="flex flex-row items-center justify-between px-4 py-3 cursor-pointer"
// //                   onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
// //                 >
// //                   {/* Bank Icon + Name + Sync */}
// //                   <div className="flex flex-row items-center gap-3">
// //                     <div className="bg-brand-tab-bg border border-brand-text-secondary rounded-lg p-2">
// //                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
// //                         <rect x="3" y="6" width="18" height="13" rx="2" stroke="#5fd93a" strokeWidth="1.5"/>
// //                         <path d="M3 10h18" stroke="#5fd93a" strokeWidth="1.5"/>
// //                       </svg>
// //                     </div>
// //                     <div className="flex flex-col">
// //                       <span className="text-brand-text text-sm font-medium">{item.institutionName}</span>
// //                       <span className="text-brand-text-secondary text-xs">
// //                         Last synced {new Date(item.updatedAt).toLocaleTimeString()}
// //                       </span>
// //                     </div>
// //                   </div>

// //                   {/* Status Badge + Delete + Chevron */}
// //                   <div className="flex flex-row items-center gap-2">
// //                     <span className={`text-xs font-medium px-3 py-1 rounded-full border ${
// //                       item.status === 'ACTIVE'
// //                         ? 'border-[#5fd93a55] bg-[#5fd93a15] text-[#5fd93a]'
// //                         : 'border-[#ef9f2755] bg-[#ef9f2715] text-[#ef9f27]'
// //                     }`}>
// //                       • {item.status === 'ACTIVE' ? 'Active' : 'Needs reauth'}
// //                     </span>
// //                     <button
// //                       className="border border-brand-text-secondary rounded-lg p-2"
// //                       onClick={e => e.stopPropagation()}
// //                     >
// //                       <svg width="12" height="12" viewBox="0 0 14 16" fill="none">
// //                         <path d="M1 4h12M5 4V2h4l-1 10H4L3 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
// //                       </svg>
// //                     </button>
// //                     <span className="text-brand-text-secondary text-xs">
// //                       {expandedId === item.id ? '▴' : '▾'}
// //                     </span>
// //                   </div>
// //                 </div>
// //                 {/* End Item Card Row */}

// //                 {/* Account List — shown when expanded */}
// //                 {expandedId === item.id && (
// //                   <div className="flex flex-col border-t border-brand-text-secondary px-4 py-3 gap-2">
// //                     <span className="text-brand-text-secondary text-[10px] uppercase tracking-widest">
// //                       Accounts
// //                     </span>
// //                     {item.accounts.map(account => (
// //                       <div key={account.id} className="flex flex-row items-center justify-between py-2 border-b border-brand-text-secondary last:border-0">
// //                         <div className="flex flex-col">
// //                           <span className="text-brand-text text-sm">{account.name}</span>
// //                           <span className="text-brand-text-secondary text-xs">••••{account.mask} · {account.subtype}</span>
// //                         </div>
// //                         <button className="text-brand-text-secondary text-xs hover:text-red-500 transition-colors">
// //                           Remove
// //                         </button>
// //                       </div>
// //                     ))}
// //                     <button className="mt-1 text-xs text-brand-text-secondary border border-dashed border-brand-text-secondary rounded-lg py-2 hover:border-[#5fd93a] hover:text-[#5fd93a] transition-colors">
// //                       + Add account
// //                     </button>
// //                   </div>
// //                 )}
// //                 {/* End Account List */}

// //               </div>
// //             ))}
// //           </div>
// //           {/* End Item Card List */}

// //         </div>
// //         {/* End Modal Container */}

// //       </div>
// //     </div>
// //   )
// // }

// export default function ConnectBank({ onSuccess: onSuccessCallback }: ConnectBankProps) {
//   const [linkToken, setLinkToken] = useState<string | null>(null)
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const modeRef = useRef<Mode>({ type: "new" })

//   const onSuccess = useCallback<PlaidLinkOnSuccess>(async (public_token, metadata) => {
//     logger.info("[onSuccess] metadata.accounts", metadata.accounts)
//     try {
//       const mode = modeRef.current
//       if (mode.type === "new") {
//         await exchangeToken(public_token, {
//           id: metadata.institution!.institution_id,
//           name: metadata.institution!.name,
//           accounts: metadata.accounts,
//         })
//         logger.info("Bank connected successfully")
//       } else {
//         await syncTransactions(mode.itemId)
//         logger.info("Accounts synced successfully")
//       }
//       setLinkToken(null)
//       onSuccessCallback?.()
//     } catch (err) {
//       logger.error("onSuccess failed", { err })
//       setError("Something went wrong. Please try again.")
//     }
//   }, [onSuccessCallback])

//   const onExit = useCallback<PlaidLinkOnExit>((err) => {
//     if (err) logger.error("Plaid Link exited with error", { err })
//     setLinkToken(null)
//   }, [])

//   const { open, ready } = usePlaidLink({
//     token: linkToken ?? "",
//     onSuccess,
//     onExit,
//   })

//   useEffect(() => {
//     if (linkToken && ready) open()
//   }, [linkToken, ready, open])

//   const handleConnect = async (instId?: string) => {
//     try {
//       setLoading(true)
//       setError(null)
//       const { link_token, mode, item_id } = await createLinkToken(instId)
//       logger.info("Link token created", { mode })
//       modeRef.current = mode === "update" && item_id
//         ? { type: "update", itemId: item_id }
//         : { type: "new" }
//       setLinkToken(link_token)
//     } catch (err) {
//       logger.error("createLinkToken failed", { err })
//       setError("Failed to initialise Plaid. Please try again.")
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
//       {/* Global connect button */}
//       <button
//         onClick={() => handleConnect()}
//         disabled={loading}
//         className="bg-[#5fd93a] hover:bg-[#72e84f] text-[#0b0b0b] font-medium text-sm px-5 py-2.5 rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed font-sora"
//       >
//         {loading ? "connecting..." : "connect bank"}
//       </button>

//       {/* Hardcoded Chase — replace with real items from API later */}
//       <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", border: "1px solid #1e1e1e", borderRadius: "8px", background: "#111" }}>
//         <span style={{ fontSize: "13px", color: "#e8e8e8", fontFamily: "Sora, sans-serif" }}>Chase</span>
//         <button
//           onClick={() => handleConnect("ins_56")}
//           disabled={loading}
//           style={{ fontFamily: "Sora, sans-serif", fontSize: "11px", color: "#555", background: "transparent", border: "1px solid #222", borderRadius: "6px", padding: "5px 12px", cursor: "pointer" }}
//         >
//           manage accounts
//         </button>
//       </div>

//       {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
//     </div>
//   )
// }
