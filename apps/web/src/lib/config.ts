// Public deploy config, driven by Vite env vars (baked in at build time).

// When true (VITE_DEMO_MODE=true), the app is the public Plaid Sandbox demo:
// signup is hidden and everyone is funneled through the shared demo account.
// The backend enforces this too (DEMO_MODE) — this just hides the UI.
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

// Plaid Sandbox universal test credentials, shown in demo mode so visitors can
// connect their own sandbox bank via Plaid Link if they want to.
export const SANDBOX_CREDENTIALS = {
  username: "user_good",
  password: "pass_good",
};
