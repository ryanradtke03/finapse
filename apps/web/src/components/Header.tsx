import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user } = useAuth();
  return (
    <header
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
      <span>{user?.name ?? "Account"}</span>
    </header>
  );
}
