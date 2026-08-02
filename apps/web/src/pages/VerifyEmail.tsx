import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../api/auth";
import { FullLogo } from "../components/Logo";
import { useAuth } from "../context/AuthContext";

type Status = "verifying" | "success" | "error";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { refresh } = useAuth();

  const [status, setStatus] = useState<Status>(token ? "verifying" : "error");
  const [error, setError] = useState(
    token ? "" : "This verification link is missing its token.",
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    verifyEmail(token)
      .then(() => {
        if (cancelled) return;
        setStatus("success");
        refresh(); // clear the "verify your email" banner if logged in
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const apiError = e as { error?: string };
        setError(apiError?.error ?? "This link is invalid or has expired.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-brand-bg px-4 text-brand-text">
      <FullLogo size="md" />
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-surface p-8 text-center shadow-2xl">
        {status === "verifying" && (
          <p className="text-brand-text-secondary">Verifying your email…</p>
        )}
        {status === "success" && (
          <>
            <h1 className="text-xl font-semibold text-brand-green">
              Email verified
            </h1>
            <p className="mt-2 text-sm text-brand-text-secondary">
              Your email is confirmed — you can now connect a bank.
            </p>
            <Link
              to="/dashboard"
              className="mt-6 inline-block cursor-pointer rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-brand-bg transition-colors duration-200 hover:bg-brand-green-hover"
            >
              Go to dashboard
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="text-xl font-semibold text-brand-error">
              Couldn't verify
            </h1>
            <p className="mt-2 text-sm text-brand-text-secondary">{error}</p>
            <Link
              to="/"
              className="mt-6 inline-block cursor-pointer rounded-lg border border-brand-border-subtle px-4 py-2 text-sm text-brand-text transition-colors duration-200 hover:border-brand-border"
            >
              Back to home
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
