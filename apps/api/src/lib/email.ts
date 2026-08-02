export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

/**
 * Send a transactional email.
 *
 * No real provider is wired yet (tracked as FIN-110) — this logs the message
 * (including any verification/reset link) to the server console so the flows
 * work end to end in dev. When a provider is added, only the body of this
 * function changes; every caller stays the same.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
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
