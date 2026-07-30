import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "./ui/Avatar";

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

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15.5 8a5.5 5.5 0 00-11 0c0 4.5-2 5.5-2 5.5h15S15.5 12.5 15.5 8z" />
      <path d="M8.3 16.2a1.7 1.7 0 003.4 0" />
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

export default function Header() {
  const { user } = useAuth();
  const location = useLocation();
  const info = PAGE_INFO[location.pathname] ?? {
    title: "Finapse",
    subtitle: "",
  };

  return (
    <header className="flex items-center justify-between border-b border-brand-border-subtle px-6 py-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-text">{info.title}</h1>
        {info.subtitle && (
          <p className="mt-1 text-sm text-brand-text-secondary">
            {info.subtitle}
          </p>
        )}
      </div>
    </header>
  );
}
