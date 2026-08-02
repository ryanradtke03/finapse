import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth";
import { FullLogo } from "../components/Logo";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is missing its token.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err: unknown) {
      const apiError = err as { error?: string };
      setError(apiError?.error ?? "This link is invalid or has expired.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-brand-bg px-4 text-brand-text">
      <FullLogo size="md" />
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-surface p-8 shadow-2xl">
        {done ? (
          <div className="text-center">
            <h1 className="text-xl font-semibold text-brand-green">
              Password updated
            </h1>
            <p className="mt-2 text-sm text-brand-text-secondary">
              You can now log in with your new password.
            </p>
            <Link
              to="/"
              className="mt-6 inline-block cursor-pointer rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-brand-bg transition-colors duration-200 hover:bg-brand-green-hover"
            >
              Back to log in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-brand-text">
              Set a new password
            </h1>
            <p className="mt-1 text-sm text-brand-text-secondary">
              Choose a new password for your account.
            </p>
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="rounded-md border border-brand-border-subtle bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-secondary focus:outline-none"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className="rounded-md border border-brand-border-subtle bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-secondary focus:outline-none"
              />
              {error && <p className="text-xs text-brand-error">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="mt-1 cursor-pointer rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-brand-bg transition-colors duration-200 hover:bg-brand-green-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Updating…" : "Update password"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
