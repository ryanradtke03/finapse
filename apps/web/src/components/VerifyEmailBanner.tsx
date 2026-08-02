import { useState } from "react";
import { resendVerification } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export function VerifyEmailBanner() {
  const { user, refresh } = useAuth();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Only for signed-in users who haven't verified yet.
  if (!user || user.emailVerified) return null;

  const handleResend = async () => {
    setError("");
    setSending(true);
    try {
      const { sent: didSend } = await resendVerification();
      if (didSend) {
        setSent(true);
      } else {
        // Already verified server-side — our banner was just stale. Refresh
        // auth state, which will hide this banner.
        await refresh();
      }
    } catch {
      setError("Couldn't send. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-warning/30 bg-brand-warning/10 px-6 py-2.5 text-sm">
      <span className="text-brand-text">
        Verify your email to connect a bank. Check your inbox for the link.
      </span>
      <div className="flex items-center gap-3">
        {sent ? (
          <span className="text-xs text-brand-green">Verification email sent.</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={sending}
            className="cursor-pointer rounded-md border border-brand-border-subtle px-3 py-1 text-xs font-medium text-brand-text transition-colors duration-150 hover:border-brand-border disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "Sending…" : "Resend email"}
          </button>
        )}
        {error && <span className="text-xs text-brand-error">{error}</span>}
      </div>
    </div>
  );
}
