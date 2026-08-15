import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "../../db/prisma";

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientID || !clientSecret) {
  // Don't register (and don't crash on boot) when Google isn't configured —
  // "Continue with Google" is simply unavailable until the creds are set.
  console.warn(
    "[auth] Google OAuth disabled — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable 'Continue with Google'.",
  );
} else {
  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        // Must match the route (mounted at /api/v1/auth/...) and the Authorized
        // redirect URI in the Google Cloud console. Override per-env if needed.
        //
        // In production point GOOGLE_CALLBACK_URL at the FRONTEND origin's
        // proxied path (https://<web-host>/api/v1/auth/google/callback), not the
        // API host. The callback is what sets the auth cookie, so it has to land
        // on the same origin the app is served from — otherwise the cookie is
        // stored against the API host and iOS blocks it on every later request.
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ?? "/api/v1/auth/google/callback",
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const rawEmail = profile.emails?.[0]?.value;

          if (!rawEmail) {
            return done(new Error("No email found from Google"));
          }

          // Normalize to match how loginUser/registerUser store emails, so a
          // casing difference can't create or miss a duplicate account.
          const email = rawEmail.trim().toLowerCase();

          const existing = await prisma.user.findUnique({ where: { email } });

          if (existing) {
            // Account-takeover guard (FIN-103): only auto-sign-in to accounts
            // that originated from Google (no password). If a *password* account
            // exists for this email, do NOT silently adopt it — an attacker
            // could have pre-registered the victim's email with a password they
            // control. The real owner can still sign in with their password;
            // genuinely linking the two would require a verified account-link
            // flow (tracked as a follow-up).
            if (existing.passwordHash) {
              return done(null, false, { message: "account_exists_password" });
            }
            // Google has verified this address; backfill the flag for accounts
            // created before email verification existed.
            if (!existing.emailVerified) {
              await prisma.user.update({
                where: { id: existing.id },
                data: { emailVerified: true },
              });
            }
            return done(null, existing);
          }

          const user = await prisma.user.create({
            data: {
              email,
              passwordHash: "",
              fullName: profile.displayName ?? "",
              emailVerified: true, // Google verifies the email address
            },
          });

          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      },
    ),
  );
}
