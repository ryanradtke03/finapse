import { useEffect, useState } from 'react';
import { useAuth } from "../context/AuthContext";
import { useItems } from "../hooks/useItems";
import { getCachedGreeting, getDashboardGreeting, setCachedGreeting } from "../utils/dashboardMessage";
import logger from "../utils/logger";

type StatCardProps = {
  title: string;
  value: string;
  insight: string;
}

const StatCard = ({ title, value, insight }: StatCardProps) => {
  return (
    <div className='h-28 flex-1 rounded-xl bg-brand-surface border border-white/10 flex flex-col justify-between p-4'>
      <span className='text-xs font-semibold tracking-widest text-brand-text-secondary uppercase'>
        {title}
      </span>
      <div className='flex flex-col gap-1'>
        <span className='text-2xl font-extrabold tracking-tight text-brand-text'>
          {value}
        </span>
        <span className='text-xs font-medium text-brand-text-secondary'>
          {insight}
        </span>
      </div>
    </div>
  );
}

const LoadingState = () => {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className='h-28 flex-1 rounded-xl bg-brand-surface border border-white/10 animate-pulse'
        />
      ))}
    </>

  );
}

export default function Dashboard(){

  const today = new Date();
  const month = today.toLocaleString('default', { month: 'long' }).toLocaleUpperCase();
  const year = today.getFullYear();

  const { data: items, isLoading, refetch } = useItems()
  const { user } = useAuth()
  const [greeting, setGreeting] = useState<{ greeting: string; saying: string } | null>(null);





  useEffect(() => {
    if (!items || !user) return;
  
    const cached = getCachedGreeting();
    if (cached) {
      setGreeting(cached);
      return;
    }
  
    const fresh = getDashboardGreeting(items, user);
    setCachedGreeting(fresh.greeting, fresh.saying);
    setGreeting(fresh);
  }, [items, user]);

  useEffect(() => {
    logger.info("Items",items)
  })


  
  
  return(
    <div className="flex flex-col justify-center items-center text-brand-text pt-8">
    {/* Header */}
    <div className="self-start flex flex-col pl-8">
      <div>
        <span className='text-brand-green font-semibold tracking-widest text-xs'>{month} {year}</span>
      </div>
      {greeting && (
        <>
          <div className='pt-2'>
            <span className='text-brand-text font-extrabold tracking-tight text-4xl'>{greeting.greeting}</span>
          </div>
          <div className='pt-1'>
            <span className='text-brand-text-hint font-medium'>{greeting.saying}</span>
          </div>
        </>
      )}
    </div>

      {/* Snapshot cards */}
      <div className='flex flex-row items-center gap-16 w-full px-8 mt-8'>
        {isLoading ? (
          <LoadingState/>
        ) : (
          <>
          <StatCard title="Net Worth" value="$24,830" insight="+$340 this month" />
          <StatCard title="Checking" value="$4,210" insight="Chase **4621" />
          <StatCard title="Savings" value="$18,400" insight="Chase **2100" />
          <StatCard title="Credit used" value="$2,220" insight="64% of limit" />
          </>
        )}    
      </div>

      {/* Feature Cards */}
      <div></div>
    </div>
  );
}



// import { useCallback, useEffect, useRef, useState } from "react"
// import type { PlaidLinkOnExit, PlaidLinkOnSuccess } from "react-plaid-link"
// import { usePlaidLink } from "react-plaid-link"
// import { createLinkToken, deleteAccount, deleteItem, exchangeToken, syncTransactions } from "../api/plaid"
// import { useAuth } from "../context/AuthContext"
// import { useItems } from "../hooks/useItems"
// import { getCachedGreeting, getDashboardGreeting, setCachedGreeting } from "../utils/dashboardMessage"
// import logger from "../utils/logger"

// type Mode = { type: "new" } | { type: "update"; itemId: string }

// export default function Dashboard() {
//   const { data: items, isLoading, refetch } = useItems()
//   const [expandedId, setExpandedId] = useState<string | null>(null)
//   const [linkToken, setLinkToken] = useState<string | null>(null)
//   const [loading, setLoading] = useState(false)
//   const [deletingId, setDeletingId] = useState<string | null>(null)
//   const [error, setError] = useState<string | null>(null)
//   const modeRef = useRef<Mode>({ type: "new" })
//   const { user } = useAuth()
//   const [greeting, setGreeting] = useState<{ greeting: string; saying: string } | null>(null);

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
//       refetch()
//     } catch (err) {
//       logger.error("onSuccess failed", { err })
//       setError("Something went wrong. Please try again.")
//     }
//   }, [refetch])

//   const onExit = useCallback<PlaidLinkOnExit>((err) => {
//     if (err) logger.error("Plaid Link exited with error", { err })
//     setLinkToken(null)
//   }, [])

//   const { open, ready } = usePlaidLink({
//     token: linkToken ?? "",
//     onSuccess,
//     onExit,
//   })

  // useEffect(() => {
  //   if (linkToken && ready) open()
  // }, [linkToken, ready, open])

  // useEffect(() => {
  //   if (!items || !user) return;
  
  //   const cached = getCachedGreeting();
  //   if (cached) {
  //     setGreeting(cached);
  //     return;
  //   }
  
  //   const fresh = getDashboardGreeting(items, user);
  //   setCachedGreeting(fresh.greeting, fresh.saying);
  //   setGreeting(fresh);
  // }, [items, user]);
  


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

//   const handleDeleteItem = async (e: React.MouseEvent, itemId: string) => {
//     e.stopPropagation()
//     try {
//       setDeletingId(itemId)
//       setError(null)
//       await deleteItem(itemId)
//       refetch()
//     } catch (err) {
//       logger.error("deleteItem failed", { err })
//       setError("Failed to remove institution. Please try again.")
//     } finally {
//       setDeletingId(null)
//     }
//   }

//   const handleDeleteAccount = async (accountId: string) => {
//     try {
//       setDeletingId(accountId)
//       setError(null)
//       await deleteAccount(accountId)
//       refetch()
//     } catch (err) {
//       logger.error("deleteAccount failed", { err })
//       setError("Failed to remove account. Please try again.")
//     } finally {
//       setDeletingId(null)
//     }
//   }

//   if (isLoading) return <div>Loading...</div>

//   return (
//     <div>
//       {greeting && (
//         <div className="text-brand-text">
//           <h1>{greeting.greeting}</h1>
//           <p>{greeting.saying}</p>
//         </div>
//       )}
//       <div className="mt-8 flex justify-center items-center">

//         <div className="bg-brand-tab-bg border-2 border-brand-text-secondary rounded-2xl flex flex-col justify-center items-center">

//           {/* Header */}
//           <div className="text-brand-text flex flex-row border-b border-b-brand-text-secondary justify-between min-w-100 py-2">
//             <div className="pl-4">Connected Accounts</div>
//             <button
//               className="pr-4 disabled:opacity-40 disabled:cursor-not-allowed"
//               onClick={() => handleConnect()}
//               disabled={loading}
//             >
//               {loading ? "Connecting..." : "+ Add Institution"}
//             </button>
//           </div>

//           {/* Empty state */}
//           {!items?.length ? (
//             <div className="text-brand-text-secondary text-sm m-8">No accounts connected yet</div>
//           ) : (
//             <div className="flex flex-col text-brand-text m-4 gap-2">
//               {items.map(item => (
//                 <div key={item.id} className="flex flex-col bg-brand-bg border border-brand-text-secondary rounded-xl min-w-[460px]">

//                   {/* Item Card Row */}
//                   <div
//                     className="flex flex-row items-center justify-between px-4 py-3 cursor-pointer"
//                     onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
//                   >
//                     <div className="flex flex-row items-center gap-3">
//                       <div className="bg-brand-tab-bg border border-brand-text-secondary rounded-lg p-2">
//                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
//                           <rect x="3" y="6" width="18" height="13" rx="2" stroke="#5fd93a" strokeWidth="1.5"/>
//                           <path d="M3 10h18" stroke="#5fd93a" strokeWidth="1.5"/>
//                         </svg>
//                       </div>
//                       <div className="flex flex-col">
//                         <span className="text-brand-text text-sm font-medium">{item.institutionName}</span>
//                         <span className="text-brand-text-secondary text-xs">
//                           Last synced {new Date(item.updatedAt).toLocaleTimeString()}
//                         </span>
//                       </div>
//                     </div>

//                     <div className="flex flex-row items-center gap-2">
//                       <span className={`text-xs font-medium px-3 py-1 rounded-full border ${
//                         item.status === 'ACTIVE'
//                           ? 'border-[#5fd93a55] bg-[#5fd93a15] text-[#5fd93a]'
//                           : 'border-[#ef9f2755] bg-[#ef9f2715] text-[#ef9f27]'
//                       }`}>
//                         • {item.status === 'ACTIVE' ? 'Active' : 'Needs reauth'}
//                       </span>
//                       <button
//                         className="border border-brand-text-secondary rounded-lg p-2 hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
//                         onClick={(e) => handleDeleteItem(e, item.id)}
//                         disabled={deletingId === item.id}
//                       >
//                         {deletingId === item.id ? (
//                           <span className="text-[10px]">...</span>
//                         ) : (
//                           <svg width="12" height="12" viewBox="0 0 14 16" fill="none">
//                             <path d="M1 4h12M5 4V2h4l-1 10H4L3 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
//                           </svg>
//                         )}
//                       </button>
//                       <span className="text-brand-text-secondary text-xs">
//                         {expandedId === item.id ? '▴' : '▾'}
//                       </span>
//                     </div>
//                   </div>

//                   {/* Account List */}
//                   {expandedId === item.id && (
//                     <div className="flex flex-col border-t border-brand-text-secondary px-4 py-3 gap-2">
//                       <span className="text-brand-text-secondary text-[10px] uppercase tracking-widest">
//                         Accounts
//                       </span>
//                       {item.accounts.map(account => (
//                         <div key={account.id} className="flex flex-row items-center justify-between py-2 border-b border-brand-text-secondary last:border-0">
//                           <div className="flex flex-col">
//                             <span className="text-brand-text text-sm">{account.name}</span>
//                             <span className="text-brand-text-secondary text-xs">••••{account.mask} · {account.subtype}</span>
//                           </div>
//                           <button
//                             className="text-brand-text-secondary text-xs hover:text-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
//                             onClick={() => handleDeleteAccount(account.id)}
//                             disabled={deletingId === account.id}
//                           >
//                             {deletingId === account.id ? "Removing..." : "Remove"}
//                           </button>
//                         </div>
//                       ))}
//                       <button
//                         className="mt-1 text-xs text-brand-text-secondary border border-dashed border-brand-text-secondary rounded-lg py-2 hover:border-[#5fd93a] hover:text-[#5fd93a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
//                         onClick={() => handleConnect(item.institutionId ?? undefined)}
//                         disabled={loading}
//                       >
//                         {loading ? "Connecting..." : "+ Add account"}
//                       </button>
//                     </div>
//                   )}

//                 </div>
//               ))}
//             </div>
//           )}

//           {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

//         </div>
//       </div>
//     </div>
//   )
// }