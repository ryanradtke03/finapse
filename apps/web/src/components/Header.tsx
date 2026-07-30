import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
