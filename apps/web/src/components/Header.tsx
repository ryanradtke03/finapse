import { useLocation } from "react-router-dom";

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className={className}
    >
      <path d="M2 4h12M2 8h12M2 12h12" />
    </svg>
  );
}

const PAGE_INFO: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Overview of your money across every linked account",
  },
  "/accounts": {
    title: "Accounts",
    subtitle: "Manage the banks and cards linked through Plaid",
  },
  "/transactions": {
    title: "Transactions",
    subtitle: "Search and filter every transaction across your accounts",
  },
  "/budgets": {
    title: "Budgets",
    subtitle: "Set per-category limits and track spending against them",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Manage your profile, security, and account",
  },
};

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const info = PAGE_INFO[location.pathname] ?? {
    title: "Finapse",
    subtitle: "",
  };

  return (
    <header className="flex items-center justify-between gap-3 border-b border-brand-border-subtle px-4 py-4 sm:px-6 sm:py-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="shrink-0 cursor-pointer text-brand-text-secondary transition-colors duration-150 hover:text-brand-text md:hidden"
      >
        <MenuIcon />
      </button>
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold text-brand-text sm:text-2xl">
          {info.title}
        </h1>
        {info.subtitle && (
          <p className="mt-1 hidden text-sm text-brand-text-secondary sm:block">
            {info.subtitle}
          </p>
        )}
      </div>
    </header>
  );
}
