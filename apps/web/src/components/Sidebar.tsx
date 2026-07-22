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
    <nav
      style={{
        width: 230,
        background: "#0d0d0d",
        borderRight: "1px solid #272727",
        padding: "16px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div
        style={{
          color: "#f4f4f5",
          fontWeight: 700,
          fontSize: 20,
          padding: "8px 12px 16px",
        }}
      >
        Finapse
      </div>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          style={({ isActive }) => ({
            padding: "10px 12px",
            borderRadius: 10,
            textDecoration: "none",
            color: isActive ? "#4ade4a" : "#8a8a8a",
            background: isActive ? "rgba(74,222,74,0.12)" : "transparent",
            fontWeight: isActive ? 700 : 400,
          })}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
