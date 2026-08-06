import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword, deleteUserAccount, updateProfile } from "../api/auth";
import { DeleteAccountModal } from "../components/DeleteAccountModal";
import { Avatar } from "../components/ui/Avatar";
import { useAuth } from "../context/AuthContext";
import { DEMO_MODE } from "../lib/config";

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 4h12M5 4V2h4l1 2M3 4l1 10h6l1-10" />
    </svg>
  );
}

export default function Settings() {
  const { user, logout, refresh } = useAuth();
  const navigate = useNavigate();

  // Profile name — editable, kept in sync with the canonical user name when it
  // changes externally (initial load / refresh) without clobbering typing.
  const [name, setName] = useState(user?.fullName ?? "");
  const [syncedName, setSyncedName] = useState(user?.fullName ?? "");
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameSubmitting, setNameSubmitting] = useState(false);
  if ((user?.fullName ?? "") !== syncedName) {
    setSyncedName(user?.fullName ?? "");
    setName(user?.fullName ?? "");
  }

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Google accounts have no password to change (FIN-85).
  const canChangePassword = user?.provider === "password";

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);

    if (newPassword.length < 8) {
      setPwError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New password and confirmation don't match");
      return;
    }

    setPwSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const apiError = err as { error?: string };
      setPwError(apiError?.error ?? "Something went wrong");
    } finally {
      setPwSubmitting(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setNameError("");
    setNameSuccess(false);

    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Name can't be empty");
      return;
    }
    if (trimmed === user?.fullName) return; // nothing changed

    setNameSubmitting(true);
    try {
      await updateProfile(trimmed);
      await refresh(); // update the name everywhere (sidebar, avatar)
      setNameSuccess(true);
    } catch (err: unknown) {
      const apiError = err as { error?: string };
      setNameError(apiError?.error ?? "Something went wrong");
    } finally {
      setNameSubmitting(false);
    }
  }

  async function handleDeleteAccount() {
    await deleteUserAccount();
    await logout();
    navigate("/");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        {/* Profile */}
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <h3 className="mb-4 font-semibold text-brand-text">Profile</h3>
          <div className="flex items-center gap-3">
            <Avatar name={user?.fullName ?? "Account"} size="lg" />
            <div>
              <p className="text-sm text-brand-text-secondary">{user?.email ?? "—"}</p>
              {!canChangePassword && (
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 px-2.5 py-1 text-xs font-medium text-indigo-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  Signed in with Google
                </span>
              )}
            </div>
          </div>

          {DEMO_MODE ? (
            <p className="mt-4 rounded-md border border-brand-border-subtle bg-brand-bg px-3 py-2 text-xs text-brand-text-secondary">
              This is a shared demo account, so profile editing is disabled.
            </p>
          ) : (
          <form
            onSubmit={handleSaveProfile}
            className="mt-4 flex max-w-sm flex-col gap-2"
          >
            <label className="text-xs text-brand-text-secondary">
              Display name
            </label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameSuccess(false);
              }}
              maxLength={100}
              disabled={nameSubmitting}
              className="rounded-md border border-brand-border-subtle bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-secondary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            {nameError && <p className="text-xs text-brand-error">{nameError}</p>}
            {nameSuccess && (
              <p className="text-xs text-brand-green">Profile updated.</p>
            )}
            <button
              type="submit"
              disabled={
                nameSubmitting ||
                !name.trim() ||
                name.trim() === (user?.fullName ?? "")
              }
              className="mt-1 w-fit cursor-pointer rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-brand-bg transition-colors duration-200 hover:bg-brand-green-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {nameSubmitting ? "Saving…" : "Save"}
            </button>
          </form>
          )}
        </div>

        {/* Session */}
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <h3 className="mb-4 font-semibold text-brand-text">Session</h3>
          <p className="text-sm text-brand-text-secondary">
            You're signed in on this device.
          </p>
          <button
            type="button"
            onClick={() => logout()}
            className="mt-4 cursor-pointer rounded-lg border border-brand-border-subtle bg-brand-surface-raised px-4 py-2 text-sm font-semibold text-brand-text transition-colors duration-200 hover:border-brand-border"
          >
            Log out
          </button>
        </div>
      </div>

      {/* Password + account deletion are disabled on the shared demo account. */}
      {!DEMO_MODE && (
      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        {/* Change password */}
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <h3 className="font-semibold text-brand-text">Change password</h3>
          <p className="mt-1 text-xs text-brand-text-secondary">
            {canChangePassword
              ? "Choose a new password for your account."
              : "Not available for Google sign-in accounts"}
          </p>
          <form
            onSubmit={handleChangePassword}
            className="mt-4 flex max-w-sm flex-col gap-3"
          >
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={!canChangePassword || pwSubmitting}
              className="rounded-md border border-brand-border-subtle bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-secondary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={!canChangePassword || pwSubmitting}
              className="rounded-md border border-brand-border-subtle bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-secondary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={!canChangePassword || pwSubmitting}
              className="rounded-md border border-brand-border-subtle bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-secondary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            {pwError && <p className="text-xs text-brand-error">{pwError}</p>}
            {pwSuccess && (
              <p className="text-xs text-brand-green">Password updated.</p>
            )}
            <button
              type="submit"
              disabled={!canChangePassword || pwSubmitting}
              className="mt-1 w-fit cursor-pointer rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-brand-bg transition-colors duration-200 hover:bg-brand-green-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pwSubmitting ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>

        {/* Danger zone */}
        <div className="rounded-xl border border-brand-error/40 bg-brand-error/5 p-5">
          <h3 className="font-semibold text-brand-error">Danger zone</h3>
          <p className="mt-2 text-sm text-brand-text-secondary">
            Deleting your account removes all linked banks, transactions, and
            budgets. This cannot be undone.
          </p>
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="mt-4 flex cursor-pointer items-center gap-2 rounded-lg border border-brand-error/40 px-4 py-2 text-sm font-semibold text-brand-error transition-colors duration-200 hover:bg-brand-error/10"
          >
            <TrashIcon />
            Delete account
          </button>
        </div>
      </div>
      )}

      <DeleteAccountModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        userEmail={user?.email ?? ""}
      />
    </div>
  );
}
