import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

// PlaidEnvironments maps env names -> base URLs (sandbox, development, production).
// We only support the two we actually use, but validate the value so a typo can
// never silently produce an `undefined` basePath.
const SUPPORTED_ENVS = ["sandbox", "production"] as const;
type PlaidEnv = (typeof SUPPORTED_ENVS)[number];

function resolvePlaidEnv(): PlaidEnv {
  const raw = process.env.PLAID_ENV ?? "sandbox";
  if (!SUPPORTED_ENVS.includes(raw as PlaidEnv)) {
    throw new Error(
      `Invalid PLAID_ENV "${raw}". Must be one of: ${SUPPORTED_ENVS.join(", ")}.`,
    );
  }
  return raw as PlaidEnv;
}

const plaidEnv = resolvePlaidEnv();

// Sandbox and production use the SAME client_id but DIFFERENT secrets. To make
// switching environments a one-line change (just flip PLAID_ENV), keep both
// secrets in the env under per-environment names and pick the matching one here.
// Falls back to a single generic PLAID_SECRET so existing setups keep working.
function resolvePlaidSecret(env: PlaidEnv): string | undefined {
  const perEnv =
    env === "production"
      ? process.env.PLAID_SECRET_PRODUCTION
      : process.env.PLAID_SECRET_SANDBOX;
  return perEnv ?? process.env.PLAID_SECRET;
}

const plaidSecret = resolvePlaidSecret(plaidEnv);

// Safety guard for the sandbox-demo / production-local split (FIN-108):
// surface which environment is live at startup so real credentials can never
// silently be paired with the wrong Plaid base URL. Never log the keys.
console.info(
  `[plaid] initializing client in "${plaidEnv}" environment` +
    (plaidEnv === "production"
      ? " — using REAL bank credentials"
      : " — using sandbox test credentials"),
);

if (!process.env.PLAID_CLIENT_ID || !plaidSecret) {
  console.warn(
    `[plaid] PLAID_CLIENT_ID and/or the secret for "${plaidEnv}" are not set ` +
      `(looked for PLAID_SECRET_${plaidEnv.toUpperCase()}, then PLAID_SECRET) ` +
      "— Plaid API calls will fail until they are configured.",
  );
}

const config = new Configuration({
  basePath: PlaidEnvironments[plaidEnv],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": plaidSecret,
    },
  },
});

export const plaidClient = new PlaidApi(config);
