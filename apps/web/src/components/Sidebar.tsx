import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "./ui/Avatar";
import { LogoIcon, LogoText } from "./Logo";

type IconComponent = (props: { className?: string }) => JSX.Element;

function IconWrap({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <IconWrap className={className}>
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </IconWrap>
  );
}

function TransactionsIcon({ className }: { className?: string }) {
  return (
    <IconWrap className={className}>
      <path d="M2 5h9m0 0L8 2m3 3L8 8" />
      <path d="M14 11H5m0 0l3 3m-3-3l3-3" />
    </IconWrap>
  );
}

function BudgetsIcon({ className }: { className?: string }) {
  return (
    <IconWrap className={className}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4v4l2 1.5" />
    </IconWrap>
  );
}

function AccountsIcon({ className }: { className?: string }) {
  return (
    <IconWrap className={className}>
      <rect x="1" y="3" width="14" height="10" rx="1.5" />
      <path d="M1 6.5h14" />
    </IconWrap>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <IconWrap className={className}>
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1.3v2.1M8 12.6v2.1M1.3 8h2.1M12.6 8h2.1M3.4 3.4l1.5 1.5M11.1 11.1l1.5 1.5M3.4 12.6l1.5-1.5M11.1 4.9l1.5-1.5" />
    </IconWrap>
  );
}

function SavingsIcon({ className }: { className?: string }) {
  return (
    <IconWrap className={className}>
      <path d="M8 14V9m0 0L5 11m3-2l3 2" />
      <path d="M3 6.5a5 5 0 0110 0" />
      <path d="M3 6.5h10" />
    </IconWrap>
  );
}

function ForecastingIcon({ className }: { className?: string }) {
  return (
    <IconWrap className={className}>
      <path d="M2 11l3-3 3 2" />
      <path d="M8 10l5-6" strokeDasharray="2 1.5" />
      <circle cx="13" cy="4" r="1.2" />
    </IconWrap>
  );
}

function AIInsightsIcon({ className }: { className?: string }) {
  return (
    <IconWrap className={className}>
      <path d="M8 2l1.3 3.4L12.7 6.7 9.3 8 8 11.4 6.7 8 3.3 6.7 6.7 5.4z" />
      <path d="M12.5 11.5l.4 1.1 1.1.4-1.1.4-.4 1.1-.4-1.1-1.1-.4 1.1-.4z" />
    </IconWrap>
  );
}

function ReportsIcon({ className }: { className?: string }) {
  return (
    <IconWrap className={className}>
      <rect x="3" y="1.5" width="10" height="13" rx="1.5" />
      <path d="M5.5 8v3M8 6v5M10.5 9v2" />
    </IconWrap>
  );
}

function CalculatorsIcon({ className }: { className?: string }) {
  return (
    <IconWrap className={className}>
      <rect x="3" y="1.5" width="10" height="13" rx="1.5" />
      <path d="M5 4.5h6" />
      <path d="M5.5 8h.01M8 8h.01M10.5 8h.01M5.5 11h.01M8 11h.01M10.5 11h.01" />
    </IconWrap>
  );
}

function InvestmentsIcon({ className }: { className?: string }) {
  return (
    <IconWrap className={className}>
      <path d="M2 12l3.5-4 3 2.5 3-4 2.5 2" />
      <circle cx="13" cy="4" r="1.3" />
    </IconWrap>
  );
}

function CategorizeIcon({ className }: { className?: string }) {
  return (
    <IconWrap className={className}>
      <path d="M2 8l5.5-5.5H12V7L6.5 12.5 2 8z" />
      <circle cx="9.2" cy="5.3" r="0.9" />
    </IconWrap>
  );
}

function SubscriptionsIcon({ className }: { className?: string }) {
  return (
    <IconWrap className={className}>
      <path d="M3.5 6.5A5 5 0 0112.5 5M13 3v3h-3" />
      <path d="M12.5 9.5A5 5 0 013.5 11M3 13v-3h3" />
    </IconWrap>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <IconWrap className={className}>
      <path d="M3 4h10M3 8h10M3 12h7" />
    </IconWrap>
  );
}

function ChevronIcon({ open, className = "" }: { open: boolean; className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-brand-text-secondary transition-transform duration-150 ${open ? "rotate-180" : ""} ${className}`}
    >
      <path d="M3 5l4 4 4-4" />
    </svg>
  );
}

type NavItemDef = { to: string; label: string; icon: IconComponent };

const topItems: NavItemDef[] = [
  { to: "/dashboard", label: "Dashboard", icon: DashboardIcon },
];

const bottomItems: NavItemDef[] = [
  { to: "/budgets", label: "Budgets", icon: BudgetsIcon },
  { to: "/accounts", label: "Accounts", icon: AccountsIcon },
];

// Sub-items nested under the Transactions group. "History" is the live
// Transactions list; the rest are placeholders.
const transactionsChildren: {
  label: string;
  icon: IconComponent;
  to?: string;
}[] = [
  { label: "History", icon: HistoryIcon, to: "/transactions" },
  { label: "Categorize", icon: CategorizeIcon },
  { label: "Subscriptions", icon: SubscriptionsIcon },
];

// A top-level nav link (Dashboard, Budgets, Accounts).
function NavItem({ to, label, icon: Icon }: NavItemDef) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex items-center gap-3 rounded-lg px-3 py-2.5 no-underline transition-colors duration-150 ${
          isActive
            ? "bg-brand-green-muted font-semibold text-brand-green"
            : "font-normal text-brand-text-secondary hover:bg-brand-surface hover:text-brand-text"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-green" />
          )}
          <Icon className={isActive ? "text-brand-green" : "text-brand-text-secondary"} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

// Planned features shown as disabled placeholders so users can see what's
// coming without being able to navigate to a dead route.
const comingSoon = [
  { label: "Savings", icon: SavingsIcon },
  { label: "Forecasting", icon: ForecastingIcon },
  { label: "AI Insights", icon: AIInsightsIcon },
  { label: "Reports", icon: ReportsIcon },
  { label: "Calculators", icon: CalculatorsIcon },
  { label: "Investments", icon: InvestmentsIcon },
];

export default function Sidebar() {
  const { user } = useAuth();
  const [txnOpen, setTxnOpen] = useState(true);

  return (
    <nav className="sticky top-0 flex h-screen w-[230px] shrink-0 flex-col border-r border-brand-border bg-brand-bg px-3 py-4">
      {/* Logo — matches the landing header (md icon + text), left-aligned with
          the nav items below via matching px-3 */}
      <div className="flex shrink-0 items-center gap-3 px-3 pb-6 pt-2">
        <LogoIcon size="md" />
        <LogoText size="md" />
      </div>

      {/* Scrollable nav area — logo stays pinned above, profile below */}
      <div className="flex-1 overflow-y-auto">

      {/* Nav items */}
      <div className="flex flex-col gap-1">
        {topItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        {/* Transactions group — expandable, with nested sub-items */}
        <div>
          <button
            type="button"
            onClick={() => setTxnOpen((o) => !o)}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 font-normal text-brand-text-secondary transition-colors duration-150 hover:bg-brand-surface hover:text-brand-text"
          >
            <TransactionsIcon className="text-brand-text-secondary" />
            <span>Transactions</span>
            <ChevronIcon open={txnOpen} className="ml-auto" />
          </button>

          {txnOpen && (
            <div className="mt-1 flex flex-col gap-1">
              {transactionsChildren.map((child) => {
                const ChildIcon = child.icon;
                if (child.to) {
                  return (
                    <NavLink
                      key={child.label}
                      to={child.to}
                      end
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg py-2 pl-8 pr-3 text-sm no-underline transition-colors duration-150 ${
                          isActive
                            ? "bg-brand-green-muted font-semibold text-brand-green"
                            : "font-normal text-brand-text-secondary hover:bg-brand-surface hover:text-brand-text"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <ChildIcon
                            className={isActive ? "text-brand-green" : "text-brand-text-secondary"}
                          />
                          <span>{child.label}</span>
                        </>
                      )}
                    </NavLink>
                  );
                }
                return (
                  <div
                    key={child.label}
                    aria-disabled="true"
                    title="Coming soon"
                    className="flex cursor-not-allowed select-none items-center gap-3 rounded-lg py-2 pl-8 pr-3 text-sm text-brand-text-hint opacity-60"
                  >
                    <ChildIcon className="text-brand-text-hint" />
                    <span>{child.label}</span>
                    <span className="ml-auto rounded-full border border-brand-border-subtle px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-brand-text-hint">
                      Soon
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {bottomItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </div>

      {/* Coming soon — disabled placeholders for planned features */}
      <div className="mt-6 flex flex-col gap-1">
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-brand-text-hint">
          Coming soon
        </p>
        {comingSoon.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              aria-disabled="true"
              title="Coming soon"
              className="flex cursor-not-allowed select-none items-center gap-3 rounded-lg px-3 py-2.5 text-brand-text-hint opacity-60"
            >
              <Icon className="text-brand-text-hint" />
              <span className="font-normal">{item.label}</span>
              <span className="ml-auto rounded-full border border-brand-border-subtle px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-brand-text-hint">
                Soon
              </span>
            </div>
          );
        })}
      </div>
      </div>

      {/* User profile — click to open Settings. Pinned to the bottom. */}
      <NavLink
        to="/settings"
        title="Settings"
        className={({ isActive }) =>
          `group mt-2 flex shrink-0 items-center gap-3 rounded-lg border-t border-brand-border-subtle px-1 pt-4 no-underline transition-colors duration-150 ${
            isActive ? "text-brand-green" : "text-brand-text hover:text-brand-text"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Avatar name={user?.fullName ?? "Account"} size="md" />
            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-sm font-semibold ${
                  isActive ? "text-brand-green" : "text-brand-text"
                }`}
              >
                {user?.fullName ?? "Account"}
              </p>
              <p className="truncate text-xs text-brand-text-secondary">
                {user?.email ?? ""}
              </p>
            </div>
            <SettingsIcon
              className={`shrink-0 transition-colors duration-150 ${
                isActive
                  ? "text-brand-green"
                  : "text-brand-text-hint group-hover:text-brand-text"
              }`}
            />
          </>
        )}
      </NavLink>
    </nav>
  );
}
