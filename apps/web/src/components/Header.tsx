import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/accounts": "Accounts",
  "/transactions": "Transactions",
  "/settings": "Settings",
};

export default function Header() {
  const { user } = useAuth();
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? "Finapse";

  return (
    <header
      className={`
        bg-brand-bg

        `}
      style={{
        height: 64,
        borderBottom: "1px solid #272727",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 24px",
        color: "#f4f4f5",
      }}
    >
      <span>{title}</span>
      <span>{user?.fullName ?? "Account"}</span>
    </header>
  );
}
