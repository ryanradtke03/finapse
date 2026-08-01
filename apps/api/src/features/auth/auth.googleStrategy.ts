import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "../../db/prisma";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/auth/google/callback",
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
          return done(null, existing);
        }

        const user = await prisma.user.create({
          data: { email, passwordHash: "", fullName: profile.displayName ?? "" },
        });

        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);