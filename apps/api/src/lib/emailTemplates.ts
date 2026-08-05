// Minimal branded HTML wrapper for transactional emails. Inline styles only —
// email clients strip <style>/external CSS — and a plain-text version is always
// sent alongside (see EmailMessage.text) as the fallback for text-only clients.

const BRAND_GREEN = "#22c55e";
const BG = "#0b0f0c";
const SURFACE = "#12181400";
const TEXT = "#e8f0ea";
const TEXT_SECONDARY = "#9aa8a0";
const BORDER = "#233029";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface TemplateInput {
  heading: string;
  body: string;
  buttonLabel: string;
  buttonUrl: string;
  footnote: string;
}

// Returns a self-contained HTML document for one transactional email.
export function renderEmail({
  heading,
  body,
  buttonLabel,
  buttonUrl,
  footnote,
}: TemplateInput): string {
  const safeUrl = escapeHtml(buttonUrl);
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:${BG};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:${SURFACE};border:1px solid ${BORDER};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <p style="margin:0 0 24px;font-size:20px;font-weight:800;color:${TEXT};letter-spacing:-0.02em;">
                  Fin<span style="color:${BRAND_GREEN};">apse</span>
                </p>
                <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${TEXT};letter-spacing:-0.02em;">
                  ${escapeHtml(heading)}
                </h1>
                <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:${TEXT_SECONDARY};">
                  ${escapeHtml(body)}
                </p>
                <a href="${safeUrl}" style="display:inline-block;background:${BRAND_GREEN};color:${BG};text-decoration:none;font-size:15px;font-weight:600;padding:12px 24px;border-radius:10px;">
                  ${escapeHtml(buttonLabel)}
                </a>
                <p style="margin:28px 0 8px;font-size:13px;line-height:1.6;color:${TEXT_SECONDARY};">
                  ${escapeHtml(footnote)}
                </p>
                <p style="margin:0;font-size:12px;line-height:1.6;color:${TEXT_SECONDARY};word-break:break-all;">
                  Or paste this link into your browser:<br />
                  <a href="${safeUrl}" style="color:${BRAND_GREEN};">${safeUrl}</a>
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:${TEXT_SECONDARY};">
            © 2026 Finapse
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// Verification email — link opens the frontend's /verify-email?token=… page.
export function verificationEmail(link: string): { subject: string; text: string; html: string } {
  return {
    subject: "Verify your Finapse email",
    text: `Welcome to Finapse! Confirm your email to unlock bank connections:\n\n${link}\n\nThis link expires in 24 hours.`,
    html: renderEmail({
      heading: "Confirm your email",
      body: "Welcome to Finapse! Confirm your email address to unlock bank connections and start tracking your money.",
      buttonLabel: "Verify email",
      buttonUrl: link,
      footnote: "This link expires in 24 hours. If you didn't create a Finapse account, you can ignore this email.",
    }),
  };
}

// Password-reset email — link opens the frontend's /reset-password?token=… page.
export function passwordResetEmail(link: string): { subject: string; text: string; html: string } {
  return {
    subject: "Reset your Finapse password",
    text: `We received a request to reset your password. Set a new one:\n\n${link}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    html: renderEmail({
      heading: "Reset your password",
      body: "We received a request to reset your Finapse password. Click below to choose a new one.",
      buttonLabel: "Reset password",
      buttonUrl: link,
      footnote: "This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't change.",
    }),
  };
}
