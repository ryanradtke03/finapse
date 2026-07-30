import { NavLink } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/transactions", label: "Transactions" },
  { to: "/budgets", label: "Budgets" },
  { to: "/accounts", label: "Accounts" },
  { to: "/settings", label: "Settings" },
];

export default function Sidebar() {
  return (
    <nav className="flex w-[230px] flex-col gap-1 border-r border-brand-border bg-brand-bg px-3 py-4">
      <div className="px-3 pb-4 pt-2 text-xl font-bold text-brand-text">
        Finapse
      </div>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `rounded-lg px-3 py-2.5 no-underline ${
              isActive
                ? "bg-brand-green-muted font-bold text-brand-green"
                : "font-normal text-brand-text-secondary"
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
