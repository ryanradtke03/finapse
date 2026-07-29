import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire up to a change-password endpoint (doesn't exist yet)
  }

  function handleDeleteAccount() {
    // Intentionally does nothing yet — no delete endpoint wired up.
    // TODO: confirm + call delete-account endpoint.
  }

  return (
    <div style={{ padding: 24, maxWidth: 640 }}>
      <h2>Settings</h2>

      {/* Profile */}
      <section style={{ margin: "24px 0" }}>
        <h3>Profile</h3>
        <p style={{ margin: 0 }}>{user?.fullName ?? "—"}</p>
        <p style={{ margin: 0, color: "#888" }}>{user?.email ?? "—"}</p>
      </section>

      {/* Session */}
      <section style={{ margin: "24px 0" }}>
        <h3>Session</h3>
        <p>You're signed in on this device.</p>
        <button onClick={() => logout()}>Log out</button>
      </section>

      {/* Change password */}
      <section style={{ margin: "24px 0" }}>
        <h3>Change password</h3>
        <form
          onSubmit={handleChangePassword}
          style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320 }}
        >
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button type="submit">Update password</button>
        </form>
      </section>

      {/* Danger zone */}
      <section
        style={{ margin: "24px 0", border: "1px solid #c00", padding: 16 }}
      >
        <h3 style={{ color: "#c00" }}>Danger zone</h3>
        <p>
          Deleting your account removes all linked banks, transactions, and
          budgets. This cannot be undone.
        </p>
        <button onClick={handleDeleteAccount} style={{ color: "#c00" }}>
          Delete account
        </button>
      </section>
    </div>
  );
}
