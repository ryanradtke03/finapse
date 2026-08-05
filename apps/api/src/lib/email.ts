import { Resend } from "resend";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  /** Optional HTML body. Clients that can't render it fall back to `text`. */
  html?: string;
}

// Which backend actually delivers mail (FIN-110):
//   - "console" (default): log the message + link to the server console. No
//     real delivery — perfect for local dev, no account/key required.
//   - "resend": send via Resend. Requires RESEND_API_KEY + EMAIL_FROM.
// Anything unset/unknown behaves as "console".
type EmailProvider = "console" | "resend";

function resolveProvider(): EmailProvider {
  return process.env.EMAIL_PROVIDER === "resend" ? "resend" : "console";
}

// Sender identity, e.g. "Finapse <onboarding@resend.dev>". For quick tests
// Resend's onboarding address works with no domain setup; real delivery needs
// a verified domain.
function fromAddress(): string {
  return process.env.EMAIL_FROM ?? "Finapse <onboarding@resend.dev>";
}

// Lazily constructed so importing this module never requires a key — only the
// resend path touches it, and only after the key is confirmed present.
let resendClient: Resend | null = null;
function getResendClient(apiKey: string): Resend {
  if (!resendClient) resendClient = new Resend(apiKey);
  return resendClient;
}

// Dev/no-op delivery: print the email (including any link) to the console so
// verification/reset flows work end to end without a provider.
function logToConsole(message: EmailMessage): void {
  console.log(
    [
      "",
      "──────────── [email] ────────────",
      `To:      ${message.to}`,
      `Subject: ${message.subject}`,
      "",
      message.text,
      "─────────────────────────────────",
      "",
    ].join("\n"),
  );
}

/**
 * Send a transactional email.
 *
 * Single delivery seam for the whole app (verification + password reset call
 * this). The backend is chosen by EMAIL_PROVIDER; callers never change.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const provider = resolveProvider();

  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      // Misconfigured (provider=resend but no key). Don't crash a signup/reset
      // over it — fall back to console so the flow still completes in dev.
      console.warn(
        "[email] EMAIL_PROVIDER=resend but RESEND_API_KEY is not set — falling back to console.",
      );
      logToConsole(message);
      return;
    }

    const { error } = await getResendClient(apiKey).emails.send({
      from: fromAddress(),
      to: message.to,
      subject: message.subject,
      text: message.text,
      ...(message.html && { html: message.html }),
    });

    if (error) {
      // Surface as a thrown error so the caller's error handling kicks in
      // (e.g. the request returns 500 rather than silently succeeding).
      throw Object.assign(new Error(`Resend delivery failed: ${error.message}`), {
        cause: error,
      });
    }
    return;
  }

  logToConsole(message);
}
