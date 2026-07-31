import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "./ui/Avatar";
import { LogoIcon, LogoText } from "./Logo";

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

const items = [
  { to: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { to: "/transactions", label: "Transactions", icon: TransactionsIcon },
  { to: "/budgets", label: "Budgets", icon: BudgetsIcon },
  { to: "/accounts", label: "Accounts", icon: AccountsIcon },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <nav className="sticky top-0 flex h-screen w-[230px] shrink-0 flex-col border-r border-brand-border bg-brand-bg px-3 py-4">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-1 pb-6 pt-2">
        <LogoIcon size="sm" />
        <LogoText size="md" />
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
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
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* User profile */}
      <div className="mt-auto flex items-center gap-3 border-t border-brand-border-subtle px-1 pt-4">
        <Avatar name={user?.fullName ?? "Account"} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-brand-text">
            {user?.fullName ?? "Account"}
          </p>
          <p className="truncate text-xs text-brand-text-secondary">
            {user?.email ?? ""}
          </p>
        </div>
      </div>
    </nav>
  );
}
